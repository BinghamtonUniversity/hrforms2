import React,{useContext,useState,useEffect,lazy,Suspense} from "react";
import {Switch,Route,useLocation,Redirect} from "react-router-dom";
import {useQueryClient} from "react-query";
import {Container,Button,Alert} from "react-bootstrap";
import {useToasts} from "react-toast-notifications";
import {useScrollPosition} from "@n8tb1t/use-scroll-position";
import { ErrorBoundary } from "react-error-boundary";
import head from "lodash/head";
import { Icon } from '@iconify/react';
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
export function getGlobal() { return useContext(GlobalContext); } //should this be getGlobalContext.  Do we need it? This is nav terms right now, cosolidate with NavContext
export function getNavContext() { return useContext(NavContext); } // do we need this?  can't we import useContext from react and import NavContext from app?

/* QUERIES */
//const {getSession,getUser,deleteSession} = useAppQueries();

/* App Banners */
const CenterPage = ({children}) => <div className="center-page">{children}</div>;
const LoadingApp = React.memo(() => (
    <CenterPage>
        <p className="display-4"><Icon icon="mdi:loading" className="spin iconify-inline"/>Starting App...</p>
    </CenterPage>
));
const LoadingAppError = ({children}) => (
    <CenterPage>
        <p className="display-4"><Icon icon="mdi:alert" className="iconify-inline"/>Failed To Load</p>
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
        console.log('session data changed',session.data);
        setAuthData(session.data);
    },[session.data]);
    if (session.isError || global.isError) return <LoadingAppError>{session.error?.message||global.error?.message}</LoadingAppError>;
    if (session.isSuccess && global.isSuccess) {
        return (
            <GlobalContext.Provider value={{...global.data}}>
                <AuthContext.Provider value={{...authData}}>
                    <ErrorBoundary FallbackComponent={AppErrorFallback}>
                        <AppContent SUNY_ID={authData.SUNY_ID} OVR_SUNY_ID={authData.OVR_SUNY_ID}/>
                    </ErrorBoundary>
                </AuthContext.Provider>
            </GlobalContext.Provider>
        );
    }
    return <LoadingApp/>;
}

function AppContent({SUNY_ID,OVR_SUNY_ID}) {
    const {getUser,getCounts} = useUserQueries();
    const user = getUser();
    const counts = getCounts({enabled:false});
    const [userData,setUserData] = useState();
    const [userCounts,setUserCounts] = useState();
    useEffect(() => {
        setUserData(head(user.data));
        counts.refetch();
    },[user.data]);
    useEffect(()=>setUserCounts(counts.data),[counts.data]);
    useEffect(()=>user.refetch(),[OVR_SUNY_ID]);
    if (user.isLoading || counts.isLoading || counts.isIdle) return <LoadingApp/>;
    if (user.isError || counts.isError) return <LoadingAppError>Failed to retreive user information</LoadingAppError>
    return (
        <UserContext.Provider value={{...userData,setUserData}}>
            <PageChange/>
            <AppNav userCounts={userCounts}/>
            <Suspense fallback={null}>
                <Container as="main" fluid>
                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                        {(userData && OVR_SUNY_ID) && <ImpersonationAlert {...userData}/>}
                        <Switch>
                            <Route exact path="/" component={Home}/>
                            <Route exact path="/request/list" component={RequestList}/>
                            <Route path="/request/list/:part" component={RequestList}/>
                            <Route path="/request/:id/:sunyid/:ts" component={Request}/>
                            <Route path="/request/:id" component={Request}/>
                            <Route path="/request" component={Request}/>
                            <Route path="/form/:id" component={HRForm}/>
                            <Route path="/form" component={HRForm}/>
                            <Route path="/admin/:page/:subpage" component={AdminPages}/>
                            <Route path="/admin/:page" component={AdminPages}/>
                            <Route path="*"><NotFound/></Route>
                        </Switch>
                    </ErrorBoundary>
                </Container>
                <Footer/>
                <ScrollToTop/>
            </Suspense>
        </UserContext.Provider>
    );
}

function AppErrorFallback({error}) {
    return (
        <div>
            <p>Fatal Error</p>
            <p>{error.message}</p>
        </div>
    );
}

function ErrorFallback({error}) {
    return (
        <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>The application encounted the following error.  If the problem persists please contact technical support</p>
            <pre>{error.message}</pre>
        </Alert>
    );
}

function ImpersonationAlert({SUNY_ID,fullname}) {
    const [redirect,setRedirect] = useState(false);

    const queryclient = useQueryClient();
    const {patchSession} = useAppQueries();
    const mutation = patchSession();

    const endImpersonation = () => {
        mutation.mutateAsync({IMPERSONATE_SUNY_ID:''}).then(d => {
            //queryclient.setQueryData('user',d);
            //let sess = queryclient.getQueryData('session');
            //sess.OVR_SUNY_ID = '';
            //sess.isAdmin = true;
            //queryclient.setQueryData('session',sess);
            queryclient.refetchQueries('session').then(()=>{
                setRedirect(true);
            });
            /*.then(()=>{
                Promise.all([
                    queryclient.refetchQueries('user'),
                    //queryclient.refetchQueries('counts')
                ]).then(()=>{
                    setRedirect(true);
                });
            });*/
        });        
    }
    useEffect(()=>setRedirect(false),[SUNY_ID]);
    if (redirect) return <Redirect to="/"/>
    return (
        <Alert variant="primary" onClose={endImpersonation} dismissible>Impersonating <strong>{fullname} ({SUNY_ID})</strong> - Close to end impersonation</Alert>
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
        <Button onClick={scrollTop} variant="secondary" size="lg" className="toTop" title="Scroll to top"><Icon icon="mdi:chevron-up" style={{margin:0,fontSize:'32px'}}/></Button>
    );
});

const NotFound = React.memo(() => {
    return (
        <h2>Page Not Found</h2>
    );
});
export {NotFound};
