import React,{ useContext, useState, useEffect, lazy, Suspense, useCallback } from "react";
import { Switch, Route, useLocation, useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";
import { ReactQueryDevtools } from 'react-query/devtools'
import { Container, Alert, Button } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { ErrorBoundary } from "react-error-boundary";
import head from "lodash/head";
import { Icon, loadIcons } from '@iconify/react';
import useUserQueries from "./queries/users";
import AppNav from "./blocks/appnav";
import Footer from "./blocks/footer";
import AppHotKeys from "./blocks/apphotkeys";
import { AppButton } from "./blocks/components";
import useSettingsQueries from "./queries/settings";
import useSessionQueries from "./queries/session";
import { Helmet } from "react-helmet";
import { icons } from "../js/config/app";

/* PAGES */
const Home = lazy(()=>import("./pages/home"));
const Request = lazy(()=>import("./pages/request"));
const RequestArchiveView = lazy(()=>import("./pages/request/view"));
const RequestArchiveList = lazy(()=>import("./pages/request/archive"));
const RequestList = lazy(()=>import("./pages/request/list"));
const RequestJournal = lazy(()=>import("./pages/request/journal"));
const HRForm = lazy(()=>import("./pages/form"));
const HRFormArchiveView = lazy(()=>import("./pages/form/view"));
const HRFormArchiveList = lazy(()=>import("./pages/form/archive"));
const HRFormList = lazy(()=>import("./pages/form/list"));
const HRFormJournal = lazy(()=>import("./pages/form/journal"));
const AdminPages = lazy(()=>import("./pages/admin"));
const TestPages = lazy(()=>import("./pages/testing"));
const VersionInfo = lazy(()=>import("./pages/version"));
const LoginHistory = lazy(()=>import("./pages/login-history"));

/* CONTEXTS */
export const AuthContext = React.createContext();
AuthContext.displayName = 'AuthContext';
export const UserContext = React.createContext();
UserContext.displayName = 'UserContext';
export const SettingsContext = React.createContext();
SettingsContext.displayName = 'SettingsContext';
export const TextContext = React.createContext();
TextContext.displayName = 'TextContext';

export function useAuthContext() { return useContext(AuthContext); }
export function useUserContext() { return useContext(UserContext); } 
export function useSettingsContext() { return useContext(SettingsContext); }
export function useTextContext() { return useContext(TextContext); }

/* Pre-Load Iconify Icons */
function loadAppIcons(icons) {
    return new Promise((resolve,reject) => {
        loadIcons(icons,(loaded,missing,pending,unsubscribe) => {
            console.debug('Pre-Loaded Icons: ',loaded);
            if (pending.length) return;
            if (missing.length) {
                console.warn('Missing Icons: ',missing);
                reject({loaded,missing});
            }
            resolve({loaded});
        });
    });
}

/* App Banners */
const LoadingApp = React.memo(() => (
    <div className="center-page">
        <p className="display-4"><Icon icon="mdi:loading" className="spin iconify-inline"/>Starting HR Forms 2...</p>
    </div>
));
const LoadingAppError = ({children}) => (
    <div className="center-page">
        <p className="display-4"><Icon icon="mdi:alert" className="iconify-inline"/>Failed To Load</p>
        <p>{children}</p>
    </div>
);
const LoggedOutApp = React.memo(() => (
    <div className="center-page">
        <p className="display-4">Logged Out</p>
        <p>You have been logged out of HR Forms 2.0</p>
        <p><a href="/">Log In Again</a></p>
    </div>
));

export default function StartApp() {
    const [authData,setAuthData] = useState();
    const { getSession } = useSessionQueries();
    const { getSettings } = useSettingsQueries();

    //const queryclient = useQueryClient();
    const session = getSession();
    const settings = getSettings({
        enabled:session.isSuccess,
        onSettled:() => {
            // Get defaults set in main.js and merge/override
            /*const defaultOptions = queryclient.getDefaultOptions();
            defaultOptions.queries.refetchOnWindowFocus = true;
            queryclient.setDefaultOptions(defaultOptions);*/
            // pre-load icons for improved performance.
            loadAppIcons(icons);
        }
    });

    useEffect(() => {
        if (session.data) {
            console.debug('Session Data:',session.data);
            setAuthData(session.data);
        }
    },[session.data]);

    if (session.isError || settings.isError) return <LoadingAppError>{session.error?.message||settings.error?.message}</LoadingAppError>;
    if (session.isSuccess && settings.isSuccess) {
        return (
            <SettingsContext.Provider value={{...settings.data}}>
                <AuthContext.Provider value={{...authData}}>
                    <TextContext.Provider value={{}}>
                        <ErrorBoundary FallbackComponent={AppErrorFallback}>
                            <Helmet 
                                titleTemplate="HR Forms 2 - %s"
                                defaultTitle="HR Forms 2"
                            />
                            <AppContent OVR_SUNY_ID={authData.OVR_SUNY_ID}/>
                            {(session.data?.DEBUG&&session.data?.isAdmin) && <ReactQueryDevtools initialIsOpen={false} />}
                        </ErrorBoundary>
                    </TextContext.Provider>
                </AuthContext.Provider>
            </SettingsContext.Provider>
        );
    }
    return <LoadingApp/>;
}

function AppContent({OVR_SUNY_ID}) {
    const { getUser } = useUserQueries();
    const user = getUser();
    const [userData,setUserData] = useState();
    useEffect(() => {
        if (!user.data) return;
        const data = head(user.data);
        setUserData(data);
        console.debug("User Data: ",data);
    },[user.data]);
    useEffect(()=>user.refetch(),[OVR_SUNY_ID]);
    if (user.isLoading) return <LoadingApp/>;
    if (user.isError) return <LoadingAppError>Failed to retreive user information</LoadingAppError>;
    if (!!userData && !userData?.SUNY_ID) {
        console.error('Missing user information',userData);
        return <LoadingAppError>Missing/Incomplete user information.  Contact system administrator.</LoadingAppError>;
    }
    return (
        <UserContext.Provider value={{...userData,setUserData}}>
            <PageChange/>
            <AppNav/>
            <AppHotKeys/>
            <Suspense fallback={null}>
                <Container as="main" fluid>
                    <NonProductionAlert/>
                    <ErrorBoundary FallbackComponent={ErrorFallback}>
                        {(userData && OVR_SUNY_ID) && <ImpersonationAlert {...userData}/>}
                        <Switch>
                            <Route exact path="/" component={Home}/>

                            <Route exact path="/request/journal" component={RequestJournal}/>
                            <Route path="/request/journal/:id" component={RequestJournal}/>
                            <Route exact path="/request/list" component={RequestList}/>
                            <Route exact path="/request/list/archived" component={RequestArchiveList}/>
                            <Route path="/request/list/:part" component={RequestList}/>
                            <Route path="/request/archive/:id" component={RequestArchiveView}/>
                            <Route path="/request/:id/:sunyid/:ts" component={Request}/>
                            <Route path="/request/:id" component={Request}/>
                            <Route path="/request" component={Request}/>

                            <Route exact path="/form/journal" component={HRFormJournal}/>
                            <Route path="/form/journal/:id" component={HRFormJournal}/>
                            <Route exact path="/form/list" component={HRFormList}/>
                            <Route exact path="/form/list/archived" component={HRFormArchiveList}/>
                            <Route path="/form/list/:part" component={HRFormList}/>
                            <Route path="/form/archive/:id" component={HRFormArchiveView}/>
                            <Route path="/form/:id/:sunyid/:ts" component={HRForm}/>
                            <Route path="/form/:id" component={HRForm}/>
                            <Route path="/form" component={HRForm}/>

                            <Route path="/admin/:page/:subpage/:pagetab" component={AdminPages}/>
                            <Route path="/admin/:page/:subpage" component={AdminPages}/>
                            <Route path="/admin/:page" component={AdminPages}/>

                            <Route path="/test/:page" component={TestPages}/>

                            <Route path="/version-info" component={VersionInfo}/>
                            <Route path="/login-history" component={LoginHistory}/>

                            <Route path="*"><NotFound/></Route>
                        </Switch>
                    </ErrorBoundary>
                </Container>
                <Footer/>
                <ScrollToTop/>
                <ToastContainer position="bottom-right"/>
            </Suspense>
        </UserContext.Provider>
    );
}

function AppErrorFallback({error}) {
    return (
        <Alert variant="danger">
            <Alert.Heading>Fatal Error</Alert.Heading>
            <p>A fatal application error was encountered.  Cannot render the application.</p>
            <pre>{error.message}</pre>
        </Alert>
    );
}

// This is the error that hits when cache needs to be cleared.  Could we use this to notify?
export function ErrorFallback({error,componentStack,resetErrorBoundary}) {
    const history = useHistory();
    const location = useLocation();
    const reset = useCallback(() => {
        history.push('/');
        resetErrorBoundary();
    },[resetErrorBoundary]);
    return (
        <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>The application encounted the following error.  If the problem persists please contact technical support.</p>
            <pre>{error.message}</pre>
            <pre>{componentStack}</pre>
            {location.pathname != '/' && 
                <>
                    <p>Clicking the "Reset" button will clear the error message and return you to the homepage.  Your work has not been saved.</p>
                    <Button onClick={reset} variant="danger">Reset</Button>
                </>
            }
        </Alert>
    );
}

function NonProductionAlert() {
    const { INSTANCE } = useAuthContext();
    if (INSTANCE != 'PROD')
    return (
        <Alert variant="warning2">
            <Icon icon="mdi:alert" className="iconify-inline"/><strong>Attention!</strong> you are currently in the <strong>{INSTANCE}</strong> instance.  This is a non-production instance used for testing and training only.
        </Alert>
    );
}

function ImpersonationAlert({SUNY_ID,fullname}) {
    const history = useHistory();
    const location = useLocation();
    const queryclient = useQueryClient();
    const { patchSession } = useSessionQueries();
    const mutation = patchSession();

    const endImpersonation = () => {
        mutation.mutateAsync({IMPERSONATE_SUNY_ID:''}).then(d => {
            queryclient.refetchQueries('session').then(()=>{
                location.pathname != '/' && history.push('/');
            });
        });
    }
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
        <AppButton format="top" onClick={scrollTop} size="lg" className="toTop d-print-none" title="Scroll to top"></AppButton>        
    );
});

const NotFound = React.memo(() => {
    return (
        <h2>Page Not Found</h2>
    );
});
export {NotFound};
