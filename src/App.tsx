import { theme } from 'config';
import { ChakraProvider } from '@chakra-ui/react';

import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

import {
  Root,
  Home,
  Appchains
} from 'views';

export const App = () => (
  <ChakraProvider theme={theme}>
    <Router>
      <Routes>
        <Route path="/" element={<Root />}>
          <Route path="" element={<Navigate to="home" />} />
          <Route path="home" element={<Home />} />
          <Route path="appchains" element={<Appchains />} />
          <Route path="appchains/overview/:appchainId" element={<Appchains />} />
        </Route>
      </Routes>
    </Router>
  </ChakraProvider>
)
