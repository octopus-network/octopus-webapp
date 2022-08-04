import { createStandaloneToast } from "@chakra-ui/toast"

export const { ToastContainer, toast } = createStandaloneToast()

export class Toast {
  static error(error: string | Error | unknown) {
    let message = ""
    if (error instanceof Error) {
      message = error.message
    } else {
      message = error as string
    }
    toast({
      position: "top-right",
      title: "Error",
      description: message,
      status: "error",
    })
  }

  static success(message: string) {
    toast({
      position: "top-right",
      title: "Success",
      description: message,
      status: "success",
    })
  }
}
