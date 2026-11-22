export function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    input.showPicker();
  }
}
