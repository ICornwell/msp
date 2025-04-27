import { render } from 'preact'
import './index.css'
import App from './app.tsx'


// if (window.location.hash !== '') {
//   render(<div>
//     <h1>Authenticating...</h1>
//   </div>, document.getElementById('app')!);
// }
// else {
  render(<div style={{ width: "100vw" }}><App /></div>, document.getElementById('app')!)
//}
