export const isValidNumber = (value: string, max: string): boolean => {
  if (value.trim() === "" || value.trim() === "0") {
    return false
  }
  const reg = /^-?\d*\.?\d*$/
  const isValid = reg.test(value)
  if (max === undefined) {
    return isValid
  }
  return isValid && Number(value) <= Number(max)
}
