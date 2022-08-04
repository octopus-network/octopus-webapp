import { Box, Spinner } from "@chakra-ui/react"
import { createStandaloneToast } from "@chakra-ui/toast"

export const { ToastContainer, toast } = createStandaloneToast()

const LoadingSpinner = () => {
  return (
    <Box p={2}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="octo-blue.500"
        size="md"
      />
    </Box>
  )
}

export class Toast {
  static error(error: string | Error | unknown) {
    let message = ""
    if (error instanceof Error) {
      message = error.message
    } else {
      message = error as string
    }
    return toast({
      position: "top-right",
      title: "Error",
      description: message,
      status: "error",
    })
  }

  static success(message: string) {
    return toast({
      position: "top-right",
      title: "Success",
      description: message,
      status: "success",
    })
  }

  static info(message: string) {
    return toast({
      position: "top-right",
      render: () => <LoadingSpinner />,
      status: "info",
      duration: null,
    })
  }
}
