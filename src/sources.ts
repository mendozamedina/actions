import * as D from "./framework";

// Sources
import { TestDestinationSource } from "./sources/test_source";
import { DropboxSource } from "./sources/dropbox";

export function allSources() : D.DestinationSource[] {
  return [
    new TestDestinationSource(),
    new DropboxSource(),
  ];
}

export async function allDestinations() {
  let srcPromises = allSources().map((src) => { return src.sourcedDestinations() });
  var all = await Promise.all(srcPromises);
  return all.reduce((a, b) => {
    return a.concat(b);
   }, []);
}

export async function findDestination(id : string) {
  let destinations = await allDestinations();
  let dest = destinations.filter((d) => {
    return d.id == id;
  })[0];
  if (!dest) {
    throw "No destination found.";
  }
  return dest;
}