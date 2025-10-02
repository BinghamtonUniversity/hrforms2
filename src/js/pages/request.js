import React,{lazy, useEffect, useMemo, useState } from "react";
import { useParams, useHistory, Prompt, Redirect } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Alert, Modal } from "react-bootstrap";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { NotFound, useSettingsContext, useUserContext } from "../app";
import useRequestQueries from "../queries/requests";
import useListsQueries from "../queries/lists";
import { useQueryClient } from "react-query";
import { Loading, AppButton, ModalConfirm } from "../blocks/components";
import format from "date-fns/format";
import get from "lodash/get";
import { Icon } from '@iconify/react';
import { RequestContext, tabs, requiredFields, resetFields, defaultVals, useRequestContext } from "../config/request";
import { t } from "../config/text";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet";
import { flattenObject } from "../utility";

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
    const {SUNY_ID} = useUserContext();

    useEffect(() => {
        if (!id||id=='new') {
            setIsNew(true);
            setIsDraft(true);
            setReqId(`draft-${SUNY_ID}`);
        } else {
            setIsDraft((id=='draft'));
            setReqId((id=='draft')?`${id}-${sunyid}-${ts}`:id);
        }
    },[id,sunyid,ts]);
    if (!reqId) return null;
    if (!SUNY_ID) return (
        <Alert variant="danger">
            Error: Invalid user SUNY ID. Please contact system administrator for assistance.
        </Alert>
    );
    return(
        <RequestWrapper reqId={reqId} isDraft={isDraft} isNew={isNew} reset={id=='new'}/>
    );
}
function RequestWrapper({reqId,isDraft,isNew,reset}) {
    const [reqData,setReqData] = useState();
    const [isBlocking,setIsBlocking] = useState(false);

    const {general} = useSettingsContext();

    const {getRequest} = useRequestQueries(reqId);
    const request = getRequest({enabled:false});

    const title = useMemo(() => {
        if (!request.data) return "Position Request";
        const status = request.data?.lastJournal?.STATUS;
        const statusText = get(general.status,status,{list:(isDraft)?'Draft':''});
        let tl = `Position Request #${reqId}`;
        if (statusText.list) tl += ' - ' + statusText.list;
        return tl;
    },[reqId,request,general,isNew]);

    useEffect(()=>{
        if (!isNew) {
            request.refetch({throwOnError:true,cancelRefetch:true}).then(r=>{
                console.debug('Request Data Fetched:\n',r.data);
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
                    <Helmet>
                        <title>{title}</title>
                    </Helmet>
                    <Col>
                        <h2>{isNew&&'New '}Position Request</h2>
                    </Col>
                </Row>
            </header>
            {reqData && <RequestForm reqId={reqId} data={reqData} setIsBlocking={setIsBlocking} isDraft={isDraft} isNew={isNew} reset={reset}/>}
            {reqData && <BlockNav reqId={reqId} when={isBlocking} isDraft={isNew}/>}
        </section>
    );
}

function BlockNav({reqId,when,isDraft}) {
    const [showModal,setShowModal] = useState(false);
    const [nextLocation,setNextLocation] = useState();
    const [shouldProceed,setShouldProceed] = useState(false);
    const {SUNY_ID} = useUserContext();
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
        //Delete if not saved
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
                    <p>
                        The request has not been saved.{' '}
                        {(isDraft)?
                            <>If you exit your draft will be <strong>discarded</strong>.</>:
                            <>If you exit your changes will not be saved.</>
                        }
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    {isDraft&&<AppButton format="delete" onClick={handleDelete}>Discard</AppButton>}
                    {!isDraft&&<AppButton format="exit" onClick={handleProceed}>Leave</AppButton>}
                    <AppButton format="close" onClick={handleClose}>Cancel</AppButton>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function RequestForm({reqId,data,setIsBlocking,isDraft,isNew,reset}) {
    const [activeTab,setActiveTab] = useState('information');
    const [lockTabs,setLockTabs] = useState(false);
    const [isSaving,setIsSaving] = useState(false);
    const [hasErrors,setHasErrors] = useState(false);
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [redirect,setRedirect] = useState('');
    const [showCloseModal,setShowCloseModal] = useState(false);

    const methods = useForm({
        mode:'onBlur',
        reValidateMode:'onChange',
        defaultValues:Object.assign({"reqId":reqId},defaultVals,data)
    });

    const {SUNY_ID,USER_GROUPS} = useUserContext();
    const {requests} = useSettingsContext();

    const queryclient = useQueryClient();
    const { getListData } = useListsQueries();
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

    const closeButtons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setShowCloseModal(false);
            }
        },
        confirm: {
            title: 'Discard',
            format: 'delete',
            callback: () => {
                setShowCloseModal(false);
                handleRedirect();
            }
        }
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
    const history = useHistory();
    const handleClose = () => {
        console.debug('Closing Request');
        if (isNew || methods.formState.isDirty) {
            setShowCloseModal(true);
        } else {
            handleRedirect();
        }
    }
    const handleReset = () => {
        methods.clearErrors();
        methods.reset(Object.assign({"reqId":reqId},defaultVals,data));
        setActiveTab('information');
        handleLockTabs(data);
        if (reset) history.push('/request/');
    }
    const handleSave = action => {
        methods.setValue('action',action);
        // Skip validation if only saving; validation errors will still trigger handleError
        (action == 'save')?methods.handleSubmit(handleSubmit,handleError)():handleValidation();
    }
    const handleDelete = () => {
        //setIsBlocking(false);
        toast.promise(new Promise((resolve,reject) => {
            deleteReq.mutateAsync().then(()=>resolve()).catch(e=>reject(e));
        }),{
            pending: t('request.actions.delete.pending'),
            success: {render(){
                handleRedirect();
                return t('request.actions.delete.success')
            }},
            error:{render({data}){
                setShowDeleteModal(false);
                return data?.description||t('request.actions.delete.error')
            }}
        });
    }
    const handleSubmit = data => {
        setHasErrors(false);
        if (!data.action) return; // just validating the form, not saving
        console.debug('Submitting Request Data:',data);
        const action = data.action;
        setIsSaving(true);
        setIsBlocking(true); //TODO: when true should be full block with no prompt
        setLockTabs(true);
        //TODO: switch? save, submit, appove, reject?
        if (['resubmit','approve','reject'].includes(action)) {
            toast.promise(new Promise((resolve,reject) => {                
                updateReq.mutateAsync(data).then(()=>{ // save the request
                    createReq.mutateAsync(data).then(()=>{
                        queryclient.refetchQueries(SUNY_ID).then(()=>resolve()).catch(e=>reject(e));
                    }).catch(e=>reject(e));
                }).catch(e=>reject(e));
            }),{
                pending:t(`request.actions.${action}.pending`),
                success: {render({data}){
                    console.debug(data);
                    handleRedirect();
                    return t(`request.actions.${action}.success`)
                }},
                error:{render({data}){
                    setIsSaving(false);
                    setLockTabs(false);
                    return data?.description||t(`request.actions.${action}.error`)
                }}
            });
            return;
        }
        if (isDraft) {
            if (isNew || data.action=='submit') {
                // submit draft request
                toast.promise(new Promise((resolve,reject) => {
                    createReq.mutateAsync(data).then(d=>resolve(d)).catch(e=>reject(e));
                }),{
                    pending:t(`request.actions.${action}.pending`),
                    success: {render({data}){
                        console.debug(data);
                        handleRedirect();
                        return t(`request.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`request.actions.${action}.error`)
                    }}
                });
            } else {
                // save draft request
                toast.promise(new Promise((resolve,reject) => {
                    updateReq.mutateAsync(data).then(()=>resolve()).catch(e=>reject(e));
                }),{
                    pending: t(`request.actions.${action}.pending`),
                    success: {render(){
                        handleRedirect();
                        return t(`request.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`request.actions.${action}.error`)
                    }}
                });
            }
        } else {
            if (data.action == 'save') {
                // approver save form
                toast.promise(new Promise((resolve,reject) => {
                    updateReq.mutateAsync(data).then(()=>resolve()).catch(e=>reject(e))
                }),{
                    pending: t(`request.actions.${action}.pending`),
                    success: {render(){
                        handleRedirect();
                        return t(`request.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`request.actions.${action}.error`)
                    }}
                });
            } else {
                // submit saved form, approve, or reject
                toast.promise(new Promise((resolve,reject) => {
                    createReq.mutateAsync(data).then(d=>resolve(d)).catch(e=>reject(e));
                }),{
                    pending: t(`request.actions.${action}.pending`),
                    success: {render(){
                        handleRedirect();
                        return t(`request.actions.${action}.success`)
                    }},
                    error:{render({data}){
                        setIsSaving(false);
                        setLockTabs(false);
                        return data?.description||t(`request.actions.${action}.error`)
                    }}
                });
            }
        }
    }
    const handleError = errors => {
        const data = methods.getValues();
        // clear errors and call handleSubmit if only saving
        if (data.action == 'save') {
            setHasErrors(false);
            handleSubmit(data);
        } else {
            setHasErrors(true);
            console.error('error:',errors);
        }
    }

    const handleLockTabs = d => {
        const posType = get(d,'posType.id');
        const reqType = get(d,'reqType.id');
        const effDate = d.effDate;
        setLockTabs(!(posType && reqType && effDate));
    }

    const canEdit = useMemo(()=>{
        if (isDraft && SUNY_ID == get(data,'CREATED_BY_SUNY_ID',SUNY_ID)) return true;
        if (!isDraft && SUNY_ID == data.lastJournal.CREATED_BY_SUNY_ID && data.lastJournal.STATUS == 'R') return true;
        if (!isDraft && SUNY_ID == data.lastJournal.CREATED_BY_SUNY_ID) return false;
        const userGroups = USER_GROUPS.split(',');
        if (userGroups.includes(get(data,'lastJournal.GROUP_TO'))) return true;
        return false;
    },[SUNY_ID,USER_GROUPS,data,isDraft]);

    useEffect(()=>setIsBlocking(methods.formState.isDirty),[methods.formState.isDirty]);
    useEffect(()=>reset&&handleReset(),[reset]);
    useEffect(() => {
        const watchFields = methods.watch((frmData,{name,type}) => {
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
        <FormProvider {...methods}>
            <RequestContext.Provider value={{
                reqId:reqId,
                createdBy:data.createdBy,
                posTypes:postypes.data,
                isNew: isNew,
                isDraft:isDraft,
                lastJournal:data.lastJournal,
                canEdit:canEdit
            }}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <RequestErrorsAlert/>
                    <Tabs activeKey={activeTab} onSelect={navigate} className="d-print-none" id="position-request-tabs">
                        {tabs.map(t=>(
                            <Tab key={t.id} eventKey={t.id} title={t.title} disabled={t.id!='information'&&lockTabs}>
                                <Container as="article" className="mt-3" fluid>
                                    {/*{hasErrors && <RequestFormErrors/>}*/}
                                    <PendingReviewAlert/>
                                    <Row as="header">
                                        <Col as="h3">{t.title}</Col>
                                    </Row>
                                    {(t.id!='information'&&t.id!='review')&& <RequestInfoBox/>}
                                    <RequestTabRouter tab={t.id}/>
                                    <Row as="footer">
                                        <Col className="button-group justify-content-end">
                                            {hasErrors && <div className="d-inline-flex align-items-center text-danger mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:alert"/><span>Errors</span></div>}
                                            {isSaving && <div className="d-inline-flex align-items-center mr-2" style={{fontSize:'20px'}}><Icon icon="mdi:loading" className="spin"/><span>Saving...</span></div>}
                                            {isDraft && 
                                                <>
                                                    {methods.formState.isDirty && <AppButton format="undo" onClick={handleReset} disabled={isSaving}>Reset</AppButton>}
                                                    {!isNew && <AppButton format="delete" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}>Delete</AppButton>}
                                                </>
                                            }
                                            {(get(data,'lastJournal.STATUS')=='R'&&canEdit) && <AppButton format="delete" onClick={()=>setShowDeleteModal(true)} disabled={isSaving}>Delete</AppButton>}

                                            {(!(isNew&&lockTabs)&&canEdit)&&<AppButton format="save-move" id="save" variant="warning" onClick={()=>handleSave('save')} disabled={isSaving||lockTabs||!methods.formState.isDirty}>Save &amp; Exit</AppButton>}

                                            <AppButton format="close" variant={isNew?'danger':'secondary'} id="close" onClick={()=>handleClose()} disabled={isSaving||lockTabs}>Close</AppButton>

                                            {t.id!='review'&&<AppButton format="next" onClick={handleNext} disabled={lockTabs}>Next</AppButton>}
                                            
                                            {t.id=='review'&&isDraft&&<AppButton format="submit" id="submit" variant="success" onClick={()=>handleSave('submit')} disabled={hasErrors||isSaving}>Submit</AppButton>}
                                            {(t.id=='review'&&!isDraft&&canEdit&&get(data,'lastJournal.STATUS')!='R') && 
                                                <>
                                                    <AppButton format="reject" id="reject" onClick={()=>handleSave('reject')} disabled={hasErrors||isSaving}>Reject</AppButton>
                                                    {(get(data,'lastJournal.STATUS')=='PF')?
                                                        <AppButton format="approve" id="final" onClick={()=>handleSave('final')} disabled={hasErrors||isSaving}>Final Approve</AppButton>
                                                    :
                                                        <AppButton format="approve" id="approve" onClick={()=>handleSave('approve')} disabled={hasErrors||isSaving}>Approve</AppButton>
                                                    }
                                                </>
                                            }
                                            {(t.id=='review'&&get(data,'lastJournal.STATUS')=='R'&&requests.menu.rejections.resubmit&&canEdit)&&
                                                <AppButton format="approve" id="resubmit" onClick={()=>handleSave('resubmit')} disabled={hasErrors||isSaving}>Resubmit</AppButton>
                                            }
                                        </Col>
                                    </Row>
                                </Container>
                            </Tab>
                        ))}
                    </Tabs>
                </Form>
                {showDeleteModal && <DeleteRequestModal setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete}/>}
                <ModalConfirm show={showCloseModal} title="Close?" buttons={closeButtons}>
                    <p>Are you sure you want to close this request? {(isNew)?'Your request will not be saved':'Your changes will not be saved'}.</p>
                </ModalConfirm>
            </RequestContext.Provider>
        </FormProvider>
    );
}

function RequestErrorsAlert() {
    const { formState: { errors } } = useFormContext();
    if (Object.keys(errors).length < 1) return null;
    return (
        <Alert variant="danger">
            <Alert.Heading>Request Errors:</Alert.Heading>
            <ul>
                {Object.entries(flattenObject(errors)).map(error => {
                    if (error[0].endsWith('.message')) return <li key={error[0]}>{error[1]}</li>;
                    return null;
                })}
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
                <Modal.Title>{t('dialog.request.delete.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {t('dialog.request.delete.message')}
            </Modal.Body>
            <Modal.Footer>
                <AppButton format="close" onClick={handleClose}>Cancel</AppButton>
                <AppButton format="delete" onClick={handleConfirm}>Delete</AppButton>
            </Modal.Footer>
        </Modal>
    );
}

function PendingReviewAlert() {
    return (
        <RequestContext.Consumer>
            {({canEdit}) => {
                if (canEdit) return null;
                return (
                    <Alert variant="warning">
                        <p className="m-0"><strong>Pending Review:</strong> This request is currently being reviewed and cannot be modified.</p>
                    </Alert>
                );
            }}
        </RequestContext.Consumer>
    )
}

function RequestInfoBox() {
    const { getValues } = useFormContext();
    const [reqId,effDate,posType,reqType,candidateName] = getValues(['reqId','effDate','posType','reqType','candidateName']);
    const { isNew } = useRequestContext();
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

function RequestTabRouter({tab}) {
    switch(tab) {
        case "information": return <Information/>;
        case "position": return <Position/>;
        case "account": return <Account/>;
        case "comments": return <Comments/>;
        case "review": return <Review/>;
        default: return <NotFound/>;
    }
}
