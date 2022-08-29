export const onTxSent = (callbackUrl = "") => {
  setTimeout(() => {
    if (callbackUrl) {
      window.location.href = callbackUrl
    } else {
      window.location.reload()
    }
  }, 500)
}
