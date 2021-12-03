import React,{useContext,useState,useEffect,lazy,Suspense} from "react";
import {Switch,Route,useLocation} from "react-router-dom";
import {useQueryClient} from "react-query";
import {Container,Button} from "react-bootstrap";
import {useToasts} from "react-toast-notifications";
import {useScrollPosition} from "@n8tb1t/use-scroll-position";
import head from "lodash/head";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useAppQueries,useUserQueries} from "./queries";
import AppNav from "./blocks/appnav";
import Footer from "./blocks/footer";

/* PAGES */
const Home = lazy(()=>import("./pages/home"));
const Request = lazy(()=>import("./pages/request"));
const RequestList = lazy(()=>import("./pages/request/list"));
const HRForm = lazy(()=>import("./pages/form"));
const AdminPages = lazy(()=>import("./pages/admin"));

/* CONTEXTS */
export const AuthContext = React.createContext();
AuthContext.displayName = 'AuthContext';
export const UserContext = React.createContext();
UserContext.displayName = 'UserContext';
export const GlobalContext = React.createContext();
GlobalContext.displayName = 'GlobalContext';

export function getAuthInfo() { return useContext(AuthContext); }
export function currentUser() { return useContext(UserContext); }
export function getGlobal() { return useContext(GlobalContext); }

/* QUERIES */
//const {getSession,getUser,deleteSession} = useAppQueries();

/* App Banners */
const CenterPage = ({children}) => <div className="center-page">{children}</div>;
const LoadingApp = React.memo(() => (
    <CenterPage>
        <p className="display-4"><FontAwesomeIcon icon="sync" spin/> Starting App...</p>
    </CenterPage>
));
const LoadingAppError = ({children}) => (
    <CenterPage>
        <p className="display-4"><FontAwesomeIcon icon="exclamation-triangle"/> Failed To Load</p>
        <p>{children}</p>
    </CenterPage>
);
const LoggedOutApp = React.memo(() => (
    <CenterPage>
        <p className="display-4">Logged Out</p>
        <p>You have been logged out of HR Forms 2.0</p>
        <p><a href="/">Log In Again</a></p>
    </CenterPage>
));

export default function StartApp() {
    const [authData,setAuthData] = useState();

    const {getSession,getTerms} = useAppQueries();

    const session = getSession();
    const global = getTerms({enabled:session.isSuccess});
    //const settings = getSettings({enabled:session.isSuccess});

    useEffect(() => {
        setAuthData(session.data);
    },[session.data]);

    if (session.isError || global.isError) return <LoadingAppError>{session.error?.message||global.error?.message}</LoadingAppError>;
    if (session.isSuccess && global.isSuccess) {
        return (
            <GlobalContext.Provider value={{...global.data}}>
                <AuthContext.Provider value={{...authData}}>
                    <AppContent SUNY_ID={authData.SUNY_ID}/>
                </AuthContext.Provider>
            </GlobalContext.Provider>
        );
    }
    return <LoadingApp/>;
}

function AppContent({SUNY_ID}) {
    const {getUser,getCounts} = useUserQueries(SUNY_ID);
    const user = getUser();
    const counts = getCounts();
    const [userData,setUserData] = useState();
    const [userCounts,setUserCounts] = useState()
    useEffect(() => {setUserData(head(user.data));},[user.data]);
    useEffect(() => {setUserCounts(counts.data);},[counts.data]);
    if (user.isLoading || counts.isLoading) return <LoadingApp/>;
    if (user.isError || counts.isError) return <LoadingAppError>Failed to retreive user information</LoadingAppError>
    return (
        <UserContext.Provider value={{...userData,setUserData}}>
            <PageChange/>
            <AppNav userCounts={userCounts}/>
            <Suspense fallback={null}>
                <Container as="main" fluid>
                    <Switch>
                        <Route exact path="/" component={Home}/>
                        <Route exact path="/request/list" component={RequestList}/>
                        <Route path="/request/list/:part" component={RequestList}/>
                        <Route path="/request/:id/:sunyid/:ts" component={Request}/>
                        <Route path="/request/:id" component={Request}/>
                        <Route path="/request" component={Request}/>
                        <Route path="/form/:id" component={HRForm}/>
                        <Route path="/form" component={HRForm}/>
                        <Route path="/admin/:page" component={AdminPages}/>
                        <Route path="*"><NotFound/></Route>
                    </Switch>
                </Container>
                <Footer/>
                <ScrollToTop/>
            </Suspense>
        </UserContext.Provider>
    );
}

const PageChange = React.memo(() => {
    const {pathname} = useLocation();
    const queryclient = useQueryClient();
    useEffect(() => {
        console.debug(`Navigate to: ${pathname}`);
        queryclient.removeQueries('userlookup'); //clear userlookup queries;
        window.scrollTo(0,0);
    },[pathname]);
    return null;
});

const ScrollToTop = React.memo(function ScrollToTop() {
    const [show,setShow] = useState(false);
    useScrollPosition(({prevPos,currPos}) => {
        setShow((currPos.y < 0));
    });
    const scrollTop = () => {
        window.scroll({top: 0, behavior: 'smooth'});
    }
    if (!show) return null;
    return (
        <Button onClick={scrollTop} variant="secondary" size="lg" className="toTop" title="Scroll to top"><FontAwesomeIcon icon="chevron-up"/></Button>
    );
});

const NotFound = React.memo(() => {
    return (
        <h2>Page Not Found</h2>
    );
});
export {NotFound};
