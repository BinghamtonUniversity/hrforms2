import React, { useState, useEffect, lazy } from "react";
import { useParams, useHistory, Prompt, Redirect } from "react-router-dom";
import { currentUser, NotFound } from "../app";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal, Nav } from "react-bootstrap";
import { useForm, FormProvider, useFormContext } from "react-hook-form";

/* TABS */
const BasicInfo = lazy(()=>import("../blocks/form/basic_info"));


const allTabs = [
    {id:'basic-info',title:'Basic Info'},
    {id:'person-info',title:'Person Info'},
    {id:'other-info',title:'Other Info'}
];

export default function HRForm() {
    const [formId,setFormId] = useState('');
    const [isNew,setIsNew] = useState(false);
    const [isDraft,setIsDraft] = useState(false);

    const {id,sunyid,ts} = useParams();
    const {SUNY_ID} = currentUser();

    useEffect(() => {
        if (!id) {
            setIsNew(true);
            setIsDraft(true);
            setFormId(`draft-${SUNY_ID}`);
        } else {
            setIsDraft((id=='draft'));
            setFormId((id=='draft')?`${id}-${sunyid}-${ts}`:id);
        }
    },[id,sunyid,ts]);
    if (!formId) return null;
    return(
        <FormWrapper formId={formId} isDraft={isDraft} isNew={isNew}/>
    );
}

function FormWrapper({formId,isDraft,isNew}) {
    const [formData,setFormData] = useState();
    const [isBlocking,setIsBlocking] = useState(false);
    const [personInfo,setPersonInfo] = useState();
    
    //TODO: probably need to change to useReducer
    const [tabList,setTabList] = useState(allTabs.filter(t=>t.id=='basic-info'));

    const [activeTab,setActiveTab] = useState('basic-info');
    const [activeNav,setActiveNav] = useState('');
    
    const methods = useForm();

    const navigate = tab => {
        //TODO: can we maintain last tab/sub-tab?  or should we use routing? so that it remembers when you switch
        const idx = tabList.findIndex(t=>t.id==tab);
        let aNav = '';
        if (Object.keys(tabList[idx]).includes('subTabs')) aNav = tabList[idx].subTabs[0].id;
        setActiveNav(aNav);
        setActiveTab(tab);
    }
    const navigate2 = nav => {
        setActiveNav(nav);
    }

    const handleSubmit = data => {
        console.log(data);
    }
    const handleError = error => {
        console.log(error);
    }

    //const {getRequest} = useRequestQueries(reqId);
    //const request = getRequest({enabled:false});
    /*useEffect(()=>{
        if (!isNew) {
            request.refetch({throwOnError:true,cancelRefetch:true}).then(r=>{
                console.log('refetch done');
                setFormData(r.data);
            }).catch(e => {
                console.error(e);
            });
        } else {
            setFormData({});
        }
    },[reqId]);
    if (request.isError) return <Loading type="alert" isError>Failed To Load Request Data - <small>{request.error?.name} - {request.error?.description||request.error?.message}</small></Loading>;
    if (!formData) return <Loading type="alert">Loading Request Data</Loading>;*/
    return(
        <>
            <header>
                <Row>
                    <Col>
                        <h2>{isNew&&'New '}HR Form</h2>
                    </Col>
                </Row>
            </header>
            <FormProvider {...methods} isDraft={isDraft}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Tabs activeKey={activeTab} onSelect={navigate} id="hr-forms-tabs">
                        {tabList.map(t => (
                            <Tab key={t.id} eventKey={t.id} title={t.title}>
                                <Container as="section" className="px-0" fluid>
                                    {t.subTabs && 
                                        <Row as="header" className="border-bottom">
                                            <Nav activeKey={activeNav} onSelect={navigate2}>
                                                {t.subTabs.map(s=>(
                                                    <Nav.Item key={s.id}>
                                                        {s.id==activeNav?
                                                            <p className="px-2 pt-2 pb-1 m-0 active">{s.title}</p>:
                                                            <Nav.Link eventKey={s.id} className="px-2 pt-2 pb-1">{s.title}</Nav.Link>
                                                        }
                                                    </Nav.Item>
                                                ))}
                                            </Nav>
                                        </Row>
                                    }
                                    <FormTabRouter tab={activeTab} subTab={activeNav} setTabList={setTabList}/>
                                    <Row as="footer">
                                        <Col className="button-group justify-content-end">
                                            <Button type="submit">Submit</Button>
                                        </Col>
                                    </Row>
                                </Container>
                            </Tab>
                        ))}
                    </Tabs>
                </Form>
            </FormProvider>
        </>
    );
}

function FormTabRouter({tab,subTab,...props}) {
    const r = tab + ((subTab)?'.'+subTab:'');
    switch(r) {
        case "basic-info": return <BasicInfo/>
        case "test-1.test-1-1": return <p>Tab 1; Sub Tab 1</p>;
        default: return <p>Not Found</p>;
    }
}

function BasicInfoTab({setTabList}) {
    const changeTabs = () => {
        console.log('change tabs');
        setTabList(allTabs.filter(t=>['basic-info','person-info'].includes(t.id)));
    }
    return (
        <Button onClick={changeTabs}>Change Tabs</Button>
    )
}

/*
                {formData && <RequestForm reqId={reqId} data={formData} setIsBlocking={setIsBlocking} isDraft={isDraft} isNew={isNew}/>}
                {formData && <BlockNav reqId={reqId} when={isBlocking} isDraft={isNew}/>}

*/
/*
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

)
}
*/