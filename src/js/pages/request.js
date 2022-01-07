import React,{lazy, useEffect, useState} from "react";
import { useParams, useHistory, Prompt } from "react-router-dom";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal } from "react-bootstrap";
import { useForm, useWatch, FormProvider, useFormContext } from "react-hook-form";
import { getAuthInfo, NotFound } from "../app";
import { useAppQueries, useRequestQueries } from "../queries";
import { useQueryClient } from "react-query";
import { useToasts } from "react-toast-notifications";
import { Loading } from "../blocks/components";
import format from "date-fns/format";
import get from "lodash/get";
import { Icon } from '@iconify/react';


/* TABS */
const Information = lazy(()=>import("../blocks/request/information"));
const Position = lazy(()=>import("../blocks/request/position"));
const Account = lazy(()=>import("../blocks/request/account"));
const Comments = lazy(()=>import("../blocks/request/comments"));
const Review = lazy(()=>import("../blocks/request/review"));

export default function Request() {
    const [reqId,setReqId] = useState('');
    const [reqData,setReqData] = useState();
    const [isNew,setIsNew] = useState(false);
    const [error,setError] = useState('');
    const [isBlocking,setIsBlocking] = useState(false);

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
            setReqData({reqId:'',SUNYAccounts:[{id:'default-SUNYAccounts',account:'',pct:'100'}]});
        } else {
            if (!isNew) {
                request.refetch().then(d=>{            
                    setReqData(d.data);
                    setReqId(d.data.reqId);
                });
            }
        }
    },[id]);
    return (
        <section>
            <header>
                <Row>
                    <Col>
                        <h2>{isNew&&'New '}Position Request</h2>
                    </Col>
                </Row>
            </header>
            {reqData && <RequestForm reqId={reqId} setReqId={setReqId} data={reqData} setIsBlocking={setIsBlocking} isNew={isNew}/>}
            {error && <Loading variant="danger" type="alert" isError>{error}</Loading>}
            {reqData && <BlockNav when={isBlocking} isNew={isNew}/>}
        </section>
    );
}

function BlockNav({when,isNew}) {
    const [showModal,setShowModal] = useState(false);
    const [nextLocation,setNextLocation] = useState();
    const [shouldProceed,setShouldProceed] = useState(false);
    const history = useHistory();
    const stopNav = location => {
        if (location.pathname.startsWith('/request/draft') && isNew) return true;
        if (!shouldProceed) {
            setShowModal(true);
            setNextLocation(location);
            return false;
        } 
        return true;
    }
    const handleClose = () => setShowModal(false);
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
                    <Button variant="danger" onClick={handleProceed}>Leave</Button>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        </>

    )
}

function RequestForm({reqId,setReqId,data,setIsBlocking,isNew}) {
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

    const { getListData } = useAppQueries();
    const {addToast,removeToast} = useToasts();
    const methods = useForm({
        mode:'onChange',
        reValidateMode:'onChange',
        defaultValues:Object.assign({},defaultVals,data)
    });

    const {postRequest,putRequest,deleteRequest} = useRequestQueries(reqId);
    const createReq = postRequest();
    const updateReq = putRequest();
    const deleteReq = deleteRequest();
    const postypes = getListData('posTypes',{enabled:false});

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
        const eventId = (e)?e.target.id:'tab';
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
                    if (eventId == 'save_draft') history.push('/');
                }).catch(e => {
                    console.error(e);
                    addToast(<><h5>Error!</h5><p>Failed to save Position Request. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                }).finally(() => {
                    setIsSaving(false);
                });
            }
        }
    }
    const handleSubmit = (data,e) => {
        console.log('submit:',data,e);
        createReq.mutateAsync({data:data}).then(() => {
            console.log('done');
        });
    }
    const handleError = (errors,e) => {
        console.log('error:',errors,e);
    }

    useEffect(() => {
        console.log('setting is blocking:',methods.formState.isDirty,isSaved);
        //but only if saved?
        setIsBlocking(methods.formState.isDirty);
    },[methods.formState.isDirty]);
    useEffect(() => {
        setLockTabs(!watchRequiredFields.every(el=>!!el));
    },[watchRequiredFields]);
    useEffect(() => {
        if (!watchPosType||!methods.formState.isDirty) return;
        console.debug('Position Type Change.  Resetting Fields');
        resetFields.forEach(f=>methods.setValue(f,''));
    },[watchPosType]);
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
                                        <Button id="save_draft" onClick={handleSave} variant="warning" disabled={lockTabs||isSaving}><Icon icon="mdi:content-save-move"/>Save &amp; Exit</Button>
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

function DeleteRequestModal({showDeleteModal,setShowDeleteModal,handleDelete}) {
    const handleClose = () => setShowDeleteModal(false);
    const handleConfirm = () => handleDelete();
    return (
        <Modal show={showDeleteModal} backdrop="static" onHide={handleClose}>
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

function RequestInfoBox() {
    const { getValues } = useFormContext();
    const [reqId,effDate,posType,reqType,candidateName] = getValues(['reqId','effDate','posType','reqType','candidateName']);
    return (
        <Alert variant="secondary">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Request ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqId}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0">{effDate && format(effDate,'M/d/yyyy')}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{posType.id} - {posType.title}</Col>
                <Col as="dt" sm={2} className="mb-0">Request Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqType.id} - {reqType.title}</Col>
                <Col as="dt" sm={2} className="mb-0">Candidate Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{candidateName}</Col>
            </Row>
        </Alert>
    );
}

function RequestTabRouter({tab,...props}) {
    switch(tab) {
        case "information": return <Information {...props}/>;
        case "position": return <Position {...props}/>;
        case "account": return <Account {...props}/>;
        case "comments": return <Comments {...props}/>;
        case "review": return <Review {...props}/>;
        default: return <NotFound/>
    }
}
