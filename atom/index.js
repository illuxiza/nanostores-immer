import { produce } from "immer";
import { atom as atomPrimitive } from "nanostores";

export let atom = initialValue => {
  let $atom = atomPrimitive(initialValue);
  $atom.mut = function (mutater) {
    $atom.set(produce($atom.value, mutater));
  };
  return $atom;
}