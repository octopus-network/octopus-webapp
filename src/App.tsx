import { theme } from 'config'
import { ChakraProvider } from '@chakra-ui/react'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import {
  Root,
  Home,
  Appchains,
  Appchain,
  Bridge,
  Register,
  Dashboard,
  Converter,
} from 'views'

export const App = () => (
  <ChakraProvider theme={theme}>
    <Router>
      <Routes>
        <Route path="/" element={<Root />}>
          <Route path="" element={<Navigate to="home" />} />
          <Route path="home" element={<Home />} />
          <Route path="appchains" element={<Appchains />} />
          <Route
            path="appchains/overview/:appchainId"
            element={<Appchains />}
          />
          <Route path="appchains/:id" element={<Appchain />} />
          <Route
            path="appchains/:id/validator/:validatorId"
            element={<Appchain />}
          />
          <Route path="bridge" element={<Bridge />} />
          <Route path="bridge/:appchainId/near" element={<Bridge />} />
          <Route path="bridge/near/:appchainId" element={<Bridge />} />
          <Route path="bridge/txs" element={<Bridge />} />
          <Route path="bridge/txs/:txId" element={<Bridge />} />
          <Route path="converter" element={<Converter />} />
          <Route path="converter/pool/:poolId" element={<Converter />} />
          <Route path="converter/pool/:poolId/manage" element={<Converter />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  </ChakraProvider>
)
