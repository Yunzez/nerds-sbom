import { NavLink } from 'react-router-dom';
import Tab from "./Tab";

export default function TabNav(props) {
  function codeTab() {
    props.setTab("dependency track");
  }

  function browseTab() {
    props.setTab("browser");
  }

  function clipTab() {
    props.setTab("clipboard");
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <Tab title="Dependency Track" onClick={codeTab} activeTab={props.tab} />
      <Tab title="Browser" onClick={browseTab} activeTab={props.tab} />
      <Tab title="Clipboard" onClick={clipTab} activeTab={props.tab} />
    </div>
  );
}
