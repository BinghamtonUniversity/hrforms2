import React,{lazy, useEffect, useState} from "react";
import { useParams, useHistory, Prompt } from "react-router-dom";
import { Row, Col, Form, Card, Nav, Button, Alert, Modal } from "react-bootstrap";
import { useForm, useWatch, FormProvider, useFormContext } from "react-hook-form";
import { getAuthInfo, NotFound } from "../app";
import { useAppQueries, useRequestQueries } from "../queries";
import { useQueryClient } from "react-query";
import { useToasts } from "react-toast-notifications";
import { Loading } from "../blocks/components";
import format from "date-fns/format";
import { Icon, InlineIcon } from '@iconify/react';


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
        if (!id) {
            const id = 'draft-'+SUNY_ID+'-'+format(new Date(),'t');
            setIsNew(true);
            setReqId(id);
            setReqData({reqId:id,SUNYAccounts:[{id:'default-SUNYAccounts',account:'',pct:'100'}]});
        } else {
            if (!isNew) {
                request.refetch().then(d=>{            
                    console.log(d);
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
            {reqData && <RequestForm reqId={reqId} data={reqData} setIsBlocking={setIsBlocking} isNew={isNew}/>}
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

function RequestForm({reqId,data,setIsBlocking,isNew}) {
    const tabs = [
        {id:'information',title:'Information'},
        {id:'position',title:'Position'},
        {id:'account',title:'Account'},
        {id:'comments',title:'Comments'},
        {id:'review',title:'Review'},
    ];

    const requiredFields = [
        {id:'posType.id',title:'Position Type'},
        {id:'reqType.id',title:'Request Type'},
        {id:'effDate',title:'Effective Date'},
        {id:'orgName',title:'Org Name'},
        {id:'comment',title:'Comment'}
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

    const [tab,setTab] = useState('information');
    const [lockTabs,setLockTabs] = useState(true);
    const [isSaved,setIsSaved] = useState(!isNew);
    const [showDeleteModal,setShowDeleteModal] = useState(false);
    const [missingFields,setMissingFields] = useState([]);

    const history = useHistory();
    const queryclient = useQueryClient();

    const { getListData } = useAppQueries();
    const {addToast,removeToast} = useToasts();
    const methods = useForm({
        mode:'onBlur',
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

    const navigate = e => {
        methods.handleSubmit(handleSave)();
        if (e.target.dataset.tab) {
            methods.trigger('orgName',{shouldFocus:true});
        }
        setTab(e.target.dataset.tab);
    }
    const handleCancel = () => {
        //TODO: need modal confirm
        setTab('information');
        methods.reset(Object.assign({},defaultVals,data));
    }
    const handleDelete = () => {
        deleteReq.mutateAsync().then(()=>{
            addToast(<><h5>Saving</h5><p>Deleting Position Request...</p></>,{appearance:'info',autoDismiss:false},id=>{
                Promise.all([
                    queryclient.refetchQueries('requestlist'),
                    queryclient.refetchQueries(['counts'])
                ]).then(()=>{
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>Position Request deleted successfully...</p></>,{appearance:'success'});
                    history.goBack();
                }).catch(e => {
                    removeToast(id);
                    addToast(<><h5>Error!</h5><p>Failed to delete Position Request. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                });
            });
        });
    }
    const handleSave = (data,e) => {
        const eventId = (e)?e.nativeEvent.submitter.id:'tab';
        console.log(eventId,data,e);
        if ((eventId == 'save_draft' || eventId == 'next' || eventId == 'tab') && methods.formState.isDirty) {
            console.log(isNew,isSaved);
            if (isNew && !isSaved) {
                //TODO: silent save?  remove toasts?
                addToast(<><h5>Saving</h5><p>Saving Position Request...</p></>,{appearance:'info',autoDismiss:false},id=>{
                    createReq.mutateAsync({reqId:reqId,data:data}).then(() => {
                        addToast(<><h5>Success!</h5><p>Position Request saved successfully...</p></>,{appearance:'success'});
                        setIsSaved(true);
                        history.replace(reqId.replaceAll('-','/'));
                        queryclient.refetchQueries('requestlist'); //update request list
                        queryclient.refetchQueries(['counts']); //update counts
                    }).catch(e => {
                        addToast(<><h5>Error!</h5><p>Failed to save Position Request. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                    }).finally(() => {
                        removeToast(id);
                    });
                });
            } else {
                addToast(<><h5>Saving</h5><p>Saving Position Request...</p></>,{appearance:'info',autoDismiss:false},id=>{
                    updateReq.mutateAsync({data:data}).then(() => {
                        addToast(<><h5>Success!</h5><p>Position Request saved successfully...</p></>,{appearance:'success'});        
                    }).catch(e => {
                        addToast(<><h5>Error!</h5><p>Failed to save Position Request. {e?.message}.</p></>,{appearance:'error',autoDismissTimeout:20000});
                    }).finally(() => {
                        removeToast(id);
                    });
                });
            }
            methods.reset(data,{keepDirty:false});
        }
        if (eventId == 'save_draft') {
            console.log('redirect to home');
            history.push('/');
            //but only after save? -- yes need to wait on redirect to happen after save.  Can we make save a promise?
        }
        if (eventId == 'next') {
            const nextTabIndex = tabs.findIndex(t=>t.id==tab)+1;
            setTab(tabs[nextTabIndex].id);
        }
    }
    useEffect(() => {
        console.log('setting isDirty:',methods.formState.isDirty,isSaved);
        //but only if saved.
        setIsBlocking(methods.formState.isDirty);
    },[methods.formState.isDirty]);
    useEffect(() => {
        console.log(watchRequiredFields);
        setLockTabs(!watchRequiredFields.filter((v,i)=>i<3).every(el=>!!el));
        setMissingFields(watchRequiredFields.map((v,i) => (v == '') && i ).filter(el=>!!el));
    },[watchRequiredFields]);
    useEffect(() => {
        if (!watchPosType) return;
        //resetfields:
        resetFields.forEach(f=>methods.setValue(f,''));
    },[watchPosType]);
    useEffect(()=>{
        console.log(reqId);
        //setIsBlocking(isNew);
        postypes.refetch();
        //data && Object.keys(data).forEach(k=>methods.setValue(k,data[k]));
        methods.reset(Object.assign({},defaultVals,data));
        methods.register('orgName',{required:'Org Name is required'});
        methods.register('comment',{required:'Comment is required'});
    },[reqId]);
    return (
        <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(handleSave)}>
                <Card>
                    <Card.Header>
                        <Nav variant="tabs">
                            {tabs.map(t=>(
                                <Nav.Item key={t.id}>
                                    <Nav.Link data-tab={t.id} active={(tab==t.id)} onClick={navigate} disabled={t.id!='information'&&lockTabs}>{t.title}</Nav.Link>
                                </Nav.Item>
                            ))}
                        </Nav>
                    </Card.Header>
                    <Card.Body>
                        {(postypes.isLoading || postypes.isIdle) && <Loading type="alert">Loading Request Data...</Loading>}
                        {postypes.isError && <Loading type="alert" isError>Error Loading Request Data</Loading>}
                        {postypes.data &&
                            <>
                                {(tab!='information'&&tab!='review') && <RequestInfoBox/>}
                                <article>
                                    <header>
                                        <h3>{tabs.find(t=>t.id==tab)?.title}</h3>
                                    </header>
                                    {tab=='review' && <ReviewAlert missingFields={missingFields}/>}
                                    <RequestTabRouter tab={tab} posTypes={postypes.data}/>
                                </article>
                            </>
                        }
                    </Card.Body>
                    <Card.Footer className="button-group" style={{display:'flex',justifyContent:'right'}}>
                        <Button variant="secondary" onClick={handleCancel}><Icon icon="mdi:close-thick"/>Cancel</Button>
                        {!isNew && <Button variant="danger" onClick={()=>setShowDeleteModal(true)}><Icon icon="mdi:delete"/>Delete</Button>}
                        <Button id="save_draft" type="submit" variant="warning" disabled={lockTabs}><Icon icon="mdi:content-save-move"/>Save Draft</Button>
                        {tab != 'review' && <Button id="next" type="submit" variant="primary" disabled={lockTabs}><Icon icon="mdi:arrow-right-thick"/>Next</Button>}
                        {tab == 'review' && <Button id="submit" type="submit" variant="primary" disabled={lockTabs||missingFields.length!=0}><Icon icon="mdi:content-save-check"/>Submit</Button>}
                    </Card.Footer>
                </Card>
                <DeleteRequestModal showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete}/>
            </Form>
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
                <Col as="dd" sm={4} className="mb-0">{format(effDate,'M/d/yyyy')}</Col>
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

function ReviewAlert({missingFields}) {
    return (
        <>
        {(missingFields.length)?
            <Alert variant="danger">
                You are missing required information in <strong>field 1</strong>, <strong>field 2</strong>, and <strong>field 3</strong>
            </Alert>
        :
            <Alert variant="warning">
                Review the information below for accuracy and correctness. When you are satisfied everything is correct you may click the submit button at the bottom.
            </Alert>
        }
        </>
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