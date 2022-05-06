import React,{lazy, useEffect, useState} from "react";
import { useParams, useHistory, Prompt, Redirect } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal } from "react-bootstrap";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { currentUser, NotFound } from "../app";
import { useAppQueries } from "../queries";
import useRequestQueries from "../queries/requests";
import { useQueryClient } from "react-query";
import { Loading, AppButton } from "../blocks/components";
import format from "date-fns/format";
import get from "lodash/get";
import { Icon } from '@iconify/react';

//TODO: need to look at the status of the request
//IF 'draft': edit only if owner
//IF 'R': edit/re-submit only if owner
//IF 'A': view only; approve/reject buttons only if approver 
//IF 'S': view only; approve/reject buttons only if approver 

/* TABS */
const Information = lazy(()=>import("../blocks/request/information"));
const Position = lazy(()=>import("../blocks/request/position"));
const Account = lazy(()=>import("../blocks/request/account"));
const Comments = lazy(()=>import("../blocks/request/comments"));
const Review = lazy(()=>import("../blocks/request/review"));

export default function Request() {
    const [reqId,setReqId] = useState('');
    const [isNew,setIsNew] = useState(false);
    const [isDraft,setIsDraft] = useState(false);

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = currentUser();

    useEffect(() => {
        if (!id) {
            //const now = getUnixTime(new Date());
            setIsNew(true);
            setIsDraft(true);
            setReqId(`draft-${SUNY_ID}`);
        } else {
            setIsDraft((id=='draft'));
            setReqId((id=='draft')?`${id}-${sunyid}-${ts}`:id);
        }
    },[id,sunyid,ts]);
    if (!reqId) return null;
    return(
        <RequestWrapper reqId={reqId} isDraft={isDraft} isNew={isNew}/>
    );
}
function RequestWrapper({reqId,isDraft,isNew}) {
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
            {reqData && <RequestForm reqId={reqId} data={reqData} setIsBlocking={setIsBlocking} isDraft={isDraft} isNew={isNew}/>}
            {reqData && <BlockNav reqId={reqId} when={isBlocking} isDraft={isNew}/>}
        </section>
    );
}

function BlockNav({reqId,when,isDraft}) {
    const [showModal,setShowModal] = useState(false);
    const [nextLocation,setNextLocation] = useState();
    const [shouldProceed,setShouldProceed] = useState(false);
    const {SUNY_ID} = currentUser();
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
        //TODO: only delete if not saved
        delReq.mutateAsync().then(()=>{
            queryclient.refetchQueries(SUNY_ID).then(() => {
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
    );
}

function RequestForm({reqId,data,setIsBlocking,isDraft,isNew}) {
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

    const {SUNY_ID} = currentUser();

    const queryclient = useQueryClient();
    const { getListData } = useAppQueries();
    const {postRequest,putRequest,deleteRequest} = useRequestQueries(reqId);
    const createReq = postRequest();
    const updateReq = putRequest();
    const deleteReq = deleteRequest();
    const postypes = getListData('posTypes');

    const handleRedirect = () => {
        queryclient.refetchQueries(SUNY_ID).then(() => {
            setShowDeleteModal(false);
            setIsSaving(false);
            setLockTabs(false);
            setIsBlocking(false);
            setRedirect('/');
        }).catch(e => {
            setShowDeleteModal(false);
            setIsSaving(false);
            setLockTabs(false);
            console.error(e);
        });
    }

    const navigate = tab => {
        methods.setValue('action','');
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
        methods.setValue('action',action);
        handleValidation();
    }
    const handleDelete = () => {
        //setIsBlocking(false);
        deleteReq.mutateAsync().then(() => {
            handleRedirect();
        }).catch(e => {
            setShowDeleteModal(false);
            console.error(e);
        });
    }
    const handleSubmit = data => {
        setHasErrors(false);
        if (!data.action) return; // just validating the form, not saving
        setIsSaving(true);
        setIsBlocking(true); //TODO: when true should be full block with no prompt
        setLockTabs(true);
        //TODO: switch? save, submit, appove, reject?
        if (isDraft) {
            if (isNew || data.action=='submit') {
                createReq.mutateAsync(data).then(d => {
                    console.debug(d);
                    handleRedirect();
                }).catch(e => {
                    //TODO: for testing
                    //TODO: need to handle errors better
                    setIsSaving(false);
                    setLockTabs(false);
                    //end testing
                    console.error(e);
                });
            } else {
                updateReq.mutateAsync(data).then(() => {
                    handleRedirect();
                }).catch(e => {
                    console.error(e);
                });
            }
        } else {
            createReq.mutateAsync(data).then(() =>{
                handleRedirect();
            }).catch(e => {
                    //TODO: for testing
                    //TODO: need to handle errors better
                    setIsSaving(false);
                    setLockTabs(false);
                    //end testing
                    console.error(e);
            });
        }
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
        <FormProvider {...methods} posTypes={postypes.data} isDraft={isDraft}>
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
                                    <Col className="button-group justify-content-end">
                                        <>
                                            {hasErrors && <div className="d-inline-flex align-items-center text-danger mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:alert"/><span>Errors</span></div>}
                                            {isSaving && <div className="d-inline-flex align-items-center mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:loading" className="spin"/><span>Saving...</span></div>}
                                            {t.id!='review'&&<AppButton format="next" onClick={handleNext} disabled={lockTabs}>Next</AppButton>}
                                            {isDraft && 
                                                <>
                                                    {methods.formState.isDirty && <AppButton format="undo" onClick={handleUndo} disabled={isSaving}>Undo</AppButton>}
                                                    {!isNew && <AppButton format="delete" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}>Delete</AppButton>}
                                                    {!(isNew&&lockTabs)&&<AppButton format="save-move" id="save" variant="warning" onClick={()=>handleSave('save')} disabled={isSaving||lockTabs||!methods.formState.isDirty}>Save &amp; Exit</AppButton>}
                                                    {t.id=='review'&&<AppButton format="submit" id="submit" variant="danger" onClick={()=>handleSave('submit')} disabled={hasErrors||isSaving}>Submit</AppButton>}
                                                </>
                                            }
                                            {(!isDraft&&t.id=='review') && 
                                                <>
                                                    <Button id="reject" variant="danger" onClick={()=>console.log('reject')} disabled={hasErrors||isSaving}><Icon icon="mdi:close-circle"/>Reject</Button>
                                                    <Button id="approve" variant="success" onClick={()=>handleSave('approve')} disabled={hasErrors||isSaving}><Icon icon="mdi:check"/>Appprove</Button>
                                                </>
                                            }
                                        </>
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
