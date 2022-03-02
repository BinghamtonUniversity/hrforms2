import React,{lazy, useEffect, useState} from "react";
import { useParams, useHistory, Prompt, Redirect } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal } from "react-bootstrap";
import { useForm, useWatch, FormProvider, useFormContext } from "react-hook-form";
import { currentUser, getAuthInfo, NotFound } from "../app";
import { useAppQueries } from "../queries";
import useRequestQueries from "../queries/requests";
import { useQueryClient } from "react-query";
import { useToasts } from "react-toast-notifications";
import { ErrorBoundary } from "react-error-boundary";
import { Loading } from "../blocks/components";
import format from "date-fns/format";
import getUnixTime from "date-fns/getUnixTime";
import get from "lodash/get";
import pick from "lodash/pick";
import { Icon } from '@iconify/react';

/* TABS */
const Information = lazy(()=>import("../blocks/request/information"));
const Position = lazy(()=>import("../blocks/request/position"));
const Account = lazy(()=>import("../blocks/request/account"));
const Comments = lazy(()=>import("../blocks/request/comments"));
const Review = lazy(()=>import("../blocks/request/review"));

export default function Request() {
    const [reqId,setReqId] = useState('');
    const [isNew,setIsNew] = useState(false);

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = getAuthInfo();

    useEffect(() => {
        if (!id) {
            const now = getUnixTime(new Date());
            setIsNew(true);
            setReqId(`draft-${SUNY_ID}-${now}`);
        } else {
            setReqId((id=='draft')?`${id}-${sunyid}-${ts}`:id);
        }
    },[id,sunyid,ts]);
    if (!reqId) return null;
    return(
        <RequestWrapper reqId={reqId} isNew={isNew}/>
    );
}
function RequestWrapper({reqId,isNew}) {
    const [reqData,setReqData] = useState();
    const [isBlocking,setIsBlocking] = useState(false);

    const {getRequest} = useRequestQueries(reqId);
    const request = getRequest({enabled:false});
    useEffect(()=>{
        if (!isNew) {
            request.refetch({throwOnError:true,cancelRefetch:true}).then(r=>{
                console.log('refetch done');
                setReqData(r.data);
            }).catch(e => {
                console.error(e);
            });
        } else {
            setReqData({});
        }
    },[reqId]);
    if (request.isError) return <Loading type="alert" isError>Failed To Load Request Data - <small>{request.error?.name} - {request.error?.description||request.error?.message}</small></Loading>;
    if (!reqData) return <Loading type="alert">Loading Request Data</Loading>;
    return(
        <section>
            <header>
                <Row>
                    <Col>
                        <h2>{isNew&&'New '}Position Request</h2>
                    </Col>
                </Row>
            </header>
            <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
                {reqData && <RequestForm reqId={reqId} data={reqData} setIsBlocking={setIsBlocking} isNew={isNew}/>}
                {reqData && <BlockNav reqId={reqId} when={isBlocking} isDraft={isNew}/>}
            </ErrorBoundary>
        </section>
    );
}
/*
export default function Request() {
    const [reqId,setReqId] = useState('');
    const [reqData,setReqData] = useState();
    const [isNew,setIsNew] = useState(false);
    const [isDraft,setIsDraft] = useState(false);
    //const [error,setError] = useState('');
    const [isBlocking,setIsBlocking] = useState(false);
    const [redirect,setRedirect] = useState('');

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = getAuthInfo();

    const {getRequest} = useRequestQueries((id=='draft')?`${id}-${sunyid}-${ts}`:(id||''));
    const request = getRequest({enabled:false,select:d => {
        if (d.hasOwnProperty('effDate') && d.effDate != '') d.effDate = new Date(d.effDate);
        if (d.hasOwnProperty('tentativeEndDate') && d.tentativeEndDate != '') d.tentativeEndDate = new Date(d.tentativeEndDate);
        return d;
    }});
    useEffect(() => {
        console.debug('ID Changed:',id);
        if (!id) {
            setIsNew(true);
            setIsDraft(true);
            setReqData({reqId:'',SUNYAccounts:[{id:'default-SUNYAccounts',account:'',pct:'100'}]});
        } else {
            if (id == 'draft') {
                setIsDraft(true);
                setIsBlocking(true);
            }
            if (!isNew) {
                request.refetch().then(d=>{            
                    setReqData(d.data);
                    setReqId(d.data.reqId);
                });
            }
        }
        return () => {
            console.log('dismounting Request...')
            setReqId('');
            setReqData(undefined);
            setIsBlocking(false);
            setIsDraft(false);
            setIsNew(false);
        }
    },[id]);
    if (redirect) return(<Redirect to={redirect}/>);
    return (
        <section>
            <header>
                <Row>
                    <Col>
                        <h2>{isNew&&'New '}Position Request</h2>
                    </Col>
                </Row>
            </header>
            {reqData && <RequestForm reqId={reqId} setReqId={setReqId} data={reqData} setIsBlocking={setIsBlocking} isNew={isNew} isDraft={isDraft} setRedirect={setRedirect}/>}
            {reqData && <BlockNav reqId={reqId} when={isBlocking} isDraft={isDraft}/>}
        </section>
    );
}
*/

function BlockNav({reqId,when,isDraft}) {
    const [showModal,setShowModal] = useState(false);
    const [nextLocation,setNextLocation] = useState();
    const [shouldProceed,setShouldProceed] = useState(false);
    const queryclient = useQueryClient();
    const {deleteRequest} = useRequestQueries(reqId);
    const delReq = deleteRequest();
    const history = useHistory();
    const stopNav = location => {
        if (!shouldProceed) {
            setShowModal(true);
            setNextLocation(location);
            return false;
        }
        return true;
    }
    const handleClose = () => setShowModal(false);
    const handleDelete = () => {
        setShowModal(false);
        delReq.mutateAsync().then(()=>{
            Promise.all([
                queryclient.refetchQueries('counts'),
                queryclient.refetchQueries('requestlist')
            ]).then(() => {
                handleProceed();
            });
        });
    }
    const handleProceed = () => {
        console.debug('proceed to location: ',nextLocation);
        setShowModal(false);
        setShouldProceed(true);
    }
    useEffect(() => shouldProceed && history.push(nextLocation.pathname),[shouldProceed]);
    return (
        <>
            <Prompt when={when} message={stopNav}/>
            <Modal show={showModal} backdrop="static" onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Exit?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    The position request has not been saved.  Do you want to leave and lose your changes?
                </Modal.Body>
                <Modal.Footer>
                    {isDraft&&<Button variant="danger" onClick={handleDelete}>Discard</Button>}
                    <Button variant="primary" onClick={handleProceed}>Leave</Button>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        </>

    )
}

function RequestForm({reqId,data,setIsBlocking,isNew}) {
    const tabs = [
        {id:'information',title:'Information'},
        {id:'position',title:'Position'},
        {id:'account',title:'Account'},
        {id:'comments',title:'Comments'},
        {id:'review',title:'Review'},
    ];
    const resetFields = [
        'reqType.id','reqType.title',
        'payBasis.id','payBasis.title',
        'reqBudgetTitle.id','reqBudgetTitle.title',
        'currentGrade','newGrade',
        'apptStatus.id','apptStatus.title',
        'expType'
    ];
    const defaultVals = {
        "reqId": reqId,
        "posType": {
            "id": "",
            "title": ""
        },
        "reqType": {
            "id": "",
            "title": ""
        },
        "effDate": "",
        "candidateName": "",
        "bNumber": "",
        "jobDesc": "",
        "lineNumber": "",
        "newLine": false,
        "multiLines": "N",
        "numLines": "",
        "minSalary": "",
        "maxSalary": "",
        "fte": "100",
        "payBasis": {
            "id": "",
            "title": ""
        },
        "currentGrade": "",
        "newGrade": "",
        "reqBudgetTitle": {
            "id": "",
            "title": ""
        },
        "apptStatus": {
            "id": "",
            "title": ""
        },
        "apptDuration": "",
        "apptPeriod": "y",
        "tentativeEndDate": "",
        "expType": "",
        "orgName": "",
        "SUNYAccountSplit":false,
        "SUNYAccounts": [
            {
                account:[{id:'',label:''}],
                pct:'100'
            }
        ],
        "comment": ""
    };
    const requiredFields = ['posType.id','reqType.id','effDate','orgName','comment'];
    const [activeTab,setActiveTab] = useState('information');
    const [lockTabs,setLockTabs] = useState(false);
    const [isSaving,setIsSaving] = useState(false);
    const [hasErrors,setHasErrors] = useState(false);
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [redirect,setRedirect] = useState('');

    const methods = useForm({
        mode:'onSubmit',
        reValidateMode:'onChange',
        defaultValues:Object.assign({},defaultVals,data)
    });

    const queryclient = useQueryClient();
    const { getListData } = useAppQueries();
    const {postRequest,putRequest,deleteRequest} = useRequestQueries(reqId);
    const createReq = postRequest();
    const updateReq = putRequest();
    const deleteReq = deleteRequest();
    const postypes = getListData('posTypes');

    const navigate = tab => {
        /*if (isNew && !methods.getValues('reqId')) {
            methods.setValue('reqId','new-draft');
        }*/
        if (tab == 'review') handleValidation();
        setActiveTab(tab);
    }

    const handleNext = () => {
        const curIdx = tabs.map(t=>t.id).indexOf(activeTab);
        const nextTab = tabs[curIdx+1]?.id;
        if (!nextTab) return;
        navigate(nextTab);
    }
    const handleValidation = () => {
        const acct_total = methods.getValues('SUNYAccounts').reduce((pv,a)=>pv+=parseInt(a.pct)||0,0);
        if (acct_total != 100) {
            methods.setError('SUNYAccounts',{
                type:'manual',
                message:'SUNY Account total percentage must equal 100%'
            });
        } else {
            methods.clearErrors('SUNYAccounts');
        }
        methods.handleSubmit(handleSubmit,handleError)();
    }
    const handleUndo = () => {
        methods.reset(Object.assign({},defaultVals,data));
    }
    const handleSave = action => {
        function test() {
            console.log('this is a test');
        }

        console.log(action);
        /*setIsSaving(true);
        setIsBlocking(true); //complete block, no prompt
        setLockTabs(true);*/

        handleValidation();
        // should not be able to submit if there are errors, just to be safe.
        if (action == 'submit' && hasErrors) return;
        
        data = methods.getValues();
        if (isNew || action=='submit') {
            createReq.mutateAsync({action:action,data:data}).then(d => {
                console.log(d);
                setIsSaving(false);
                setIsBlocking(false);
                setLockTabs(false);
                if (action=='save') {
                    Promise.all([
                        queryclient.refetchQueries('requestlist'), //update request list
                        queryclient.refetchQueries(['counts']) //update counts
                    ]).catch(e => {
                        console.error(e);
                    }).finally(() => {
                        setRedirect('/');
                    });
                }
            }).catch(e => {
                console.error(e);
            });
        } else {
            updateReq.mutateAsync({data:data}).then(() => {
                //TODO - make this a function?
                setIsSaving(false);
                setIsBlocking(false);
                setLockTabs(false);
                if (action=='save') { //submit should also redirect
                    Promise.all([
                        queryclient.refetchQueries('requestlist'), //update request list
                        queryclient.refetchQueries(['counts']) //update counts
                    ]).catch(e => {
                        console.error(e);
                    }).finally(() => {
                        setRedirect('/');
                    });
                }
            }).catch(e => {
                console.error(e);
            });
        }
    }
    const handleDelete = () => {
        console.log('do delete...');
        deleteReq.mutateAsync().then(() => {
            setShowDeleteModal(false);
            //TODO: function? 
            Promise.all([
                queryclient.refetchQueries('requestlist'), //update request list
                queryclient.refetchQueries(['counts']) //update counts
            ]).catch(e => {
                console.error(e);
            }).finally(() => {
                setRedirect('/');
            });
        }).catch(e => {
            setShowDeleteModal(false);
            console.error(e);
        });
    }
    const handleSubmit = data => {
        setHasErrors(false);
        console.log(data);
    }
    const handleError = errors => {
        setHasErrors(true);
        console.error('error:',errors);
    }

    const handleLockTabs = d => {
        const posType = get(d,'posType.id');
        const reqType = get(d,'reqType.id');
        const effDate = d.effDate;
        setLockTabs(!(posType && reqType && effDate));
    }
    useEffect(()=>{
        setIsBlocking(methods.formState.isDirty);
    },[methods.formState.isDirty]);
    useEffect(() => {
        const watchFields = methods.watch((frmData,{name,type}) => {
            //console.log(name,type);
            if (type == 'change') {
                handleLockTabs(frmData);
                if (name == 'posType.id') {
                    resetFields.forEach(fld=>methods.setValue(fld,''));
                    setLockTabs(true);
                }
                if (requiredFields.includes(name)) {
                    methods.trigger(name).then(() => {
                        setHasErrors(!!Object.keys(methods.formState.errors).length);
                    });
                }
            }
        });
        return () => watchFields.unsubscribe();
    },[methods.watch]);
    useEffect(() => {handleLockTabs(data)},[reqId]);

    if (redirect) return <Redirect to={redirect}/>;
    if (postypes.isError) return <Loading type="alert" isError>Error Loading Position Types</Loading>;
    if (postypes.isLoading) return <Loading type="alert">Loading Position Types</Loading>;
    if (!postypes.data) return <Loading type="alert" isError>Error - No Position Type Data Loaded</Loading>;
    return(
        <FormProvider {...methods} posTypes={postypes.data}>
            <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                <Tabs activeKey={activeTab} onSelect={navigate} id="position-request-tabs">
                    {tabs.map(t=>(
                        <Tab key={t.id} eventKey={t.id} title={t.title} disabled={t.id!='information'&&lockTabs}>
                            <Container as="article" className="mt-3" fluid>
                                <Row as="header">
                                    <Col as="h3">{t.title}</Col>
                                </Row>
                                {hasErrors && <RequestFormErrors/>}
                                {(t.id!='information'&&t.id!='review')&& <RequestInfoBox isNew={isNew}/>}
                                <RequestTabRouter tab={t.id} isNew={isNew}/>
                                <Row as="footer">
                                    <Col className="button-group button-group-right">
                                        {hasErrors && <div className="d-inline-flex align-items-center text-danger mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:alert"/><span>Errors</span></div>}
                                        {isSaving && <div className="d-inline-flex align-items-center mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:loading" className="spin"/><span>Saving...</span></div>}
                                        {methods.formState.isDirty && <Button variant="secondary" onClick={handleUndo} disabled={isSaving}><Icon icon="mdi:undo"/>Undo</Button>}
                                        {!isNew && <Button variant="danger" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}><Icon icon="mdi:delete"/>Delete</Button>}
                                        {!(isNew&&lockTabs)&&<Button id="save" variant="warning" onClick={()=>handleSave('save')} disabled={isSaving||lockTabs||!methods.formState.isDirty}><Icon icon="mdi:content-save-move"/>Save &amp; Exit</Button>}
                                        {t.id!='review'&&<Button variant="primary" onClick={handleNext} disabled={lockTabs}><Icon icon="mdi:arrow-right-thick"/>Next</Button>}
                                        {t.id=='review'&&<Button id="submit" variant="danger" onClick={()=>handleSave('submit')} disabled={hasErrors||isSaving}><Icon icon="mdi:content-save-check"/>Submit</Button>}
                                    </Col>
                                </Row>
                            </Container>
                        </Tab>
                    ))}
                </Tabs>
            </Form>
            {showDeleteModal && <DeleteRequestModal setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete}/>}
        </FormProvider>
    );
}

function ErrorBoundaryFallback({error}) {
    return (
        <Row>
            <Col>
                <Alert variant="danger">
                    <Alert.Heading><Icon className="iconify-inline" icon="mdi:alert" /> Application Error</Alert.Heading>
                    <p>An error occurred within the application.  If the problem persists please contact technical support.</p>
                    <pre>{error?.message}</pre>
                </Alert>
            </Col>
        </Row>
    );
}

function RequestFormErrors() {
    const {formState:{errors}} = useFormContext();
    return (
        <Alert variant="danger">
            <Alert.Heading><Icon className="iconify-inline" icon="mdi:alert"/>Error!</Alert.Heading>
            <ul>
                {Object.keys(errors).map(k=><li key={k}>{errors[k].message}</li>)}
            </ul>
        </Alert>
    );
}

function RequestFormOLD({reqId,setReqId,data,setIsBlocking,isNew,isDraft,setRedirect}) {
    const tabs = [
        {id:'information',title:'Information'},
        {id:'position',title:'Position'},
        {id:'account',title:'Account'},
        {id:'comments',title:'Comments'},
        {id:'review',title:'Review'},
    ];

    const requiredFields = [
        {id:'posType.id',label:'Position Type'},
        {id:'reqType.id',label:'Request Type'},
        {id:'effDate',label:'Effective Date'}
    ];

    const resetFields = [
        'reqType.id','reqType.title',
        'payBasis.id','payBasis.title',
        'reqBudgetTitle.id','reqBudgetTitle.title',
        'currentGrade','newGrade',
        'apptStatus.id','apptStatus.title',
        'expType'
    ];

    const defaultVals = {
        "reqId": "",
        "posType": {
            "id": "",
            "title": ""
        },
        "reqType": {
            "id": "",
            "title": ""
        },
        "effDate": "",
        "candidateName": "",
        "bNumber": "",
        "jobDesc": "",
        "lineNumber": "",
        "newLine": false,
        "multiLines": "N",
        "numLines": "",
        "minSalary": "",
        "maxSalary": "",
        "fte": "100",
        "payBasis": {
            "id": "",
            "title": ""
        },
        "currentGrade": "",
        "newGrade": "",
        "reqBudgetTitle": {
            "id": "",
            "title": ""
        },
        "apptStatus": {
            "id": "",
            "title": ""
        },
        "apptDuration": "",
        "apptPeriod": "y",
        "tentativeEndDate": "",
        "expType": "",
        "orgName": "",
        "SUNYAccounts": [
            {
                "id": "default-SUNYAccounts",
                "account": "",
                "pct": "100"
            }
        ],
        "comment": ""
    };

    const [activeTab,setActiveTab] = useState('information');
    const [lockTabs,setLockTabs] = useState(true);
    const [isSaved,setIsSaved] = useState(!isNew);
    const [isSaving,setIsSaving] = useState(false);
    const [showDeleteModal,setShowDeleteModal] = useState(false);

    const history = useHistory();
    const queryclient = useQueryClient();

    const user = currentUser();

    const { getListData } = useAppQueries();
    const {addToast,removeToast} = useToasts();
    const methods = useForm({
        mode:'onSubmit',//TODO:change to onSubmit?
        reValidateMode:'onChange',
        defaultValues:Object.assign({},defaultVals,data)
    });

    const {postRequest,putRequest,deleteRequest} = useRequestQueries(reqId);
    const createReq = postRequest();
    const updateReq = putRequest();
    const deleteReq = deleteRequest();
    const postypes = getListData('posTypes',{enabled:false});

    //TODO: useWatch optimized for render not useEffect; need custom hook.
    const watchPosType = useWatch({name:'posType.id',control:methods.control});
    const watchRequiredFields = useWatch({name:requiredFields.map(fld=>fld.id),control:methods.control});

    const navigate = tab => {
        const newTab = (tab == '_next')?tabs[tabs.findIndex(t=>t.id==activeTab)+1].id:tab;
        if (newTab == 'review') {
            console.log('trigger');
            methods.trigger().then(()=>{
                setActiveTab(newTab);
                handleSave();
            });
        } else {
            setActiveTab(newTab);
            handleSave();
        }
    }
    const handleUndo = () => {
        methods.reset(Object.assign({},defaultVals,data));
    }
    const handleDelete = () => {
        deleteReq.mutateAsync().then(()=>{
            addToast(<><h5>Delete</h5><p>Deleting Position Request...</p></>,{appearance:'info',autoDismiss:false},id=>{
                Promise.all([
                    queryclient.refetchQueries('requestlist'),
                    queryclient.refetchQueries(['counts'])
                ]).then(()=>{
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>Position Request deleted successfully...</p></>,{appearance:'success'});
                    history.goBack();
                }).catch(e => {
                    removeToast(id);
                    addToast(<><h5>Error!</h5><p>Failed to delete Position Request. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                });
            });
        });
    }
    const handleSave = e => {
        const eventId = (e)?e.target.closest('BUTTON').id:'tab';
        const data = methods.getValues();
        console.log('handleSave:',eventId,data,e);
        if (methods.formState.isDirty) {
            setIsSaving(true);
            if (isNew && !isSaved) {
                createReq.mutateAsync({data:data}).then(d => {
                    data.reqId = d.reqId;
                    setIsSaved(true);
                    setReqId(d.reqId);
                    history.replace(d.reqId.replaceAll('-','/'));
                    methods.reset(data);
                    queryclient.refetchQueries('requestlist'); //update request list
                    queryclient.refetchQueries(['counts']); //update counts
                }).catch(e => {
                    console.error(e);
                    addToast(<><h5>Error!</h5><p>Failed to save Position Request. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                }).finally(() => {
                    setIsSaving(false);
                });
            } else {
                updateReq.mutateAsync({data:data}).then(() => {
                    if (eventId == 'save_draft') {
                        console.debug('navigate home');
                        setRedirect('/');
                    }
                }).catch(e => {
                    console.error(e);
                    addToast(<><h5>Error!</h5><p>Failed to save Position Request. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                }).finally(() => {
                    setIsSaving(false);
                });
            }
        }
    }
    const handleSubmit = data => {
        data['submitterDeptCode'] = user?.REPORTING_DEPARTMENT_CODE
        console.log('submit:',data,user);
        /*createReq.mutateAsync({data:data}).then(() => {
            console.log('done');
        });*/
    }
    const handleError = (errors,e) => {
        console.log('error:',errors,e);
    }

    /*useEffect(() => {
        console.log('setting is blocking:',methods.formState.isDirty,isSaved,isNew);
        //but only if saved?
        if (!isDraft) setIsBlocking(methods.formState.isDirty);
    },[methods.formState.isDirty]);
    useEffect(() => {
        setLockTabs(!watchRequiredFields.every(el=>!!el));
    },[watchRequiredFields]);
    useEffect(() => {
        if (!watchPosType||!methods.formState.isDirty) return;
        console.debug('Position Type Change.  Resetting Fields');
        resetFields.forEach(f=>methods.setValue(f,''));
    },[watchPosType]);*/
    useEffect(()=>{
        postypes.refetch();
        methods.reset(Object.assign({},defaultVals,data));
    },[reqId]);
    return (
        <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                <Tabs activeKey={activeTab} onSelect={navigate} id="position-request-tabs">
                    {tabs.map(t=>(
                        <Tab key={t.id} eventKey={t.id} title={t.title} disabled={t.id!='information'&&lockTabs}>
                            <Container as="article" className="mt-3" fluid>
                                <Row as="header">
                                    <Col as="h3">{t.title}</Col>
                                </Row>
                                {(t.id!='information'&&t.id!='review')&& <RequestInfoBox/>}
                                {postypes.data && <RequestTabRouter tab={t.id} posTypes={postypes.data}/>}
                                <Row as="footer">
                                    <Col className="button-group button-group-right">
                                        {isSaving && <Button variant="" disabled><Icon icon="mdi:loading" className="spin"/> Saving...</Button>}
                                        {methods.formState.isDirty && <Button variant="secondary" onClick={handleUndo} disabled={isSaving}><Icon icon="mdi:undo"/>Undo</Button>}
                                        {!isNew && <Button variant="danger" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}><Icon icon="mdi:delete"/>Delete</Button>}
                                        <Button id="save_draft" onClick={handleSave} variant="warning" ><Icon icon="mdi:content-save-move"/>Save &amp; Exit</Button>
                                        {activeTab != 'review' && <Button id="next" onClick={()=>navigate('_next')} variant="primary" disabled={lockTabs||isSaving}><Icon icon="mdi:arrow-right-thick"/>Next</Button>}
                                        {activeTab == 'review' && <Button id="submit" type="submit" variant="primary" disabled={!!Object.keys(methods.formState.errors).length||isSaving}><Icon icon="mdi:content-save-check"/>Submit</Button>}
                                    </Col>
                                </Row>
                            </Container>
                        </Tab>
                    ))}
                </Tabs>
            </Form>
            <DeleteRequestModal showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete}/>
        </FormProvider>
    );
}
//disabled={lockTabs||isSaving}

function DeleteRequestModal({setShowDeleteModal,handleDelete}) {
    const handleClose = () => setShowDeleteModal(false);
    const handleConfirm = () => handleDelete();
    return (
        <Modal show={true} backdrop="static" onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Delete?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleConfirm}>Confirm</Button>
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
} 

function RequestInfoBox({isNew}) {
    const { getValues } = useFormContext();
    const [reqId,effDate,posType,reqType,candidateName] = getValues(['reqId','effDate','posType','reqType','candidateName']);
    return (
        <Alert variant="secondary">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Request ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0">{effDate && format(effDate,'M/d/yyyy')}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{posType?.id} - {posType?.title}</Col>
                <Col as="dt" sm={2} className="mb-0">Request Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqType?.id} - {reqType?.title}</Col>
                <Col as="dt" sm={2} className="mb-0">Candidate Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{candidateName}</Col>
            </Row>
        </Alert>
    );
}

function RequestTabRouter({tab,isNew}) {
    switch(tab) {
        case "information": return <Information/>;
        case "position": return <Position/>;
        case "account": return <Account/>;
        case "comments": return <Comments/>;
        case "review": return <Review isNew={isNew}/>;
        default: return <NotFound/>;
    }
}
