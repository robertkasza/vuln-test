import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Greeting } from '@vuln-test/ui'
import { greet } from '@vuln-test/utils'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Greeting message={greet('admin')} />
  </StrictMode>,
)
