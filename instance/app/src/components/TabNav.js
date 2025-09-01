import { NavLink } from 'react-router-dom';
import Tab from "./Tab";

export default function TabNav(props) {
  function codeTab() {
    props.setTab("code");
  }

  function browseTab() {
    props.setTab("browser");
  }

  function clipTab() {
    props.setTab("clipboard");
  }

  return (
    <>
      <Tab title="Dependency Track" onClick={codeTab} activeTab={props.tab} />
      <Tab title="Broswer" onClick={browseTab} activeTab={props.tab} />
      <Tab title="Clipboard" onClick={clipTab} activeTab={props.tab} />
    </>
  );
}
