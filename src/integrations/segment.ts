import Segment = require("analytics-node")
import * as D from "../framework"

const idTags = ["email", "segment_user_id"]

D.addIntegration({
  name: "segment_event",
  label: "Segment - Create Events",
  iconName: "segment.png",
  description: "Create events for a particular user in Segment.",
  params: [
    {
      description: "A write key for Segment.",
      label: "Segment Write Key",
      name: "segment_write_key",
      required: true,
      sensitive: true,
    },
  ],
  supportedActionTypes: ["query"],
  supportedFormats: ["json_detail"],
  supportedFormattings: ["unformatted"],
  supportedVisualizationFormattings: ["noapply"],
  requiredFields: [{any_tag: idTags}],

  action: async (request) => {
    return new Promise<D.DataActionResponse>((resolve, reject) => {

      const segment = segmentClientFromRequest(request)

      if (!(request.attachment && request.attachment.dataJSON)) {
        reject("No attached json")
        return
      }

      const qr = request.attachment.dataJSON
      const fields: any[] = [].concat(...Object.keys(qr.fields).map((k) => qr.fields[k]))

      const idFields = fields.filter((f: any) =>
        f.tags.some((t: string) => idTags.indexOf(t) !== -1)
      )

      if (idFields.length == 0) {
        reject(`Query requires a field tagged ${idTags.join(" or ")}`)
        return
      }

      const idField: any = idFields[0]

      for (const row of qr.data) {
        const idValue = row[idField.name].value
        const traits: any = {}
        for (const field of fields) {
          if (field.name != idField.name) {
            traits[field.name] = row[field.name].value
          }
        }
        segment.identify({
          traits: traits,
          userId: idValue,
        })
      }

      // TODO: does this batching have global state that could be a security problem
      segment.flush((err, _batch) => {
        if (err) {
          reject(err)
        } else {
          resolve(new D.DataActionResponse())
        }
      })

    })
  },

})

function segmentClientFromRequest(request: D.DataActionRequest) {
  return new Segment(request.params.segment_write_key)
}