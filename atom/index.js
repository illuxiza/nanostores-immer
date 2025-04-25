import { produce } from "immer";
import { atom as atomPrimitive } from "nanostores";

export let atom = initialValue => {
  let $atom = atomPrimitive(initialValue);
  $atom.mut = function (mutater) {
    let oldValue = $atom.value
    let newValue = produce(oldValue, mutater);
    if (oldValue !== newValue) {
      $atom.value = newValue
      $atom.notify(oldValue)
    }
  };
  return $atom;
}