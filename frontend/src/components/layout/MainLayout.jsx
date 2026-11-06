import { mapClassNames } from '../../styles/classNames.js';
import module0 from '../../styles/scaffold.module.scss';
const cx = value => mapClassNames(value, module0);
import { Outlet } from 'react-router-dom';
import Header from './Header';
export default function MainLayout() { return <><Header /><main className={cx("container")}><Outlet /></main></>; }
