import React, { useState, useEffect } from "react";
import { useParams, useHistory, Prompt, Redirect } from "react-router-dom";
import { currentUser, NotFound } from "../app";
import { Container, Row, Col, Form, Tabs, Tab, Button, Alert, Modal } from "react-bootstrap";
import { useForm, FormProvider, useFormContext } from "react-hook-form";

/* TABS */


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
            <FormPersonLookup/>
            <p>show after lookup...</p>
        </>
    );
}

function FormPersonLookup() {
    return (
        <section>
            <Row as="header">
                <Col as="h3">Person Lookup</Col>
            </Row>
            <article>
                <Row>
                    <Col>lookup form...</Col>
                </Row>
            </article>
        </section>
    );
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