import React,{lazy, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import { Row, Col, Form, Card, Nav, Button, Alert } from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import { NotFound } from "../app";
import { useAppQueries } from "../queries";
import { Loading } from "../blocks/components";
import format from "date-fns/format";

/* TABS */
const Information = lazy(()=>import("../blocks/request/information"));
const Position = lazy(()=>import("../blocks/request/position"));
const Account = lazy(()=>import("../blocks/request/account"));
const Comments = lazy(()=>import("../blocks/request/comments"));

export default function Request() {
    const {id} = useParams();
    //if id then fetch data; else new
    //const request = getRequest(id,{enabled:!!id})
    return (
        <section>
            <header>
                <Row>
                    <Col>
                        <h2>{!id&&'New '}Position Request</h2>
                    </Col>
                </Row>
            </header>
            <RequestForm id={id} data={{}}/>
        </section>
    );
}

function RequestForm({id,data}) {
    const [tab,setTab] = useState('information');
    const [lockTabs,setLockTabs] = useState(!!data);
    const [reqTypes,setReqTypes] = useState([]);
    const [payBasisTypes,setPayBasisTypes] = useState([]);
    const [apptTypes,setApptTypes] = useState([]);

    const { getListData } = useAppQueries();
    const { handleSubmit, control, getValues, setValue, formState: { errors } } = useForm({mode:'onBlur',reValidateMode:'onChange'});

    const postypes = getListData('posTypes',{enabled:false});
    const reqtypes = getListData('reqTypes',{enabled:false});
    const paybasistypes = getListData('payBasisTypes',{enabled:false});
    const appttypes = getListData('apptTypes',{enabled:false});

    const watchPosType = useWatch({name:'posType',control:control});
    const watchRequired = useWatch({name:['posType','reqType','effDate'],control:control});

    const navigate = e => {
        setTab(e.target.dataset.tab);
    }

    const saveRequest = data => {
        console.log(data);
    }
    useEffect(() => {
        setLockTabs(!watchRequired.every(a=>!!a));
    },[watchRequired]);
    useEffect(() => {
        if (!watchPosType) return;
        //resetfields:
        ['reqType','payBasis','reqBudgetTitle','currentGrade','newGrade','expType'].forEach(f=>setValue(f,''));
        //todo: move to then after refetch?
        reqtypes.data && setReqTypes(reqtypes.data.filter(r=>postypes.data[watchPosType].reqTypes.includes(r[0])));
        paybasistypes.data && setPayBasisTypes(paybasistypes.data.filter(p=>postypes.data[watchPosType].payBasisTypes.includes(p[0])));
        appttypes.data && setApptTypes(appttypes.data.filter(a=>postypes.data[watchPosType].apptTypes.includes(a[0])).sort());
    },[watchPosType]);
    useEffect(()=>{
        postypes.refetch();
        reqtypes.refetch();
        paybasistypes.refetch();
        appttypes.refetch();
    },[id]);
    return (
        <Form onSubmit={handleSubmit(saveRequest)}>
            <Card>
                <Card.Header>
                    <Nav variant="tabs">
                        <Nav.Item>
                            <Nav.Link data-tab="information" active={(tab=="information")} onClick={navigate}>Information</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link data-tab="position" active={(tab=="position")} onClick={navigate} disabled={lockTabs}>Position</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link data-tab="account" active={(tab=="account")} onClick={navigate} disabled={lockTabs}>Account</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link data-tab="comments" active={(tab=="comments")} onClick={navigate} disabled={lockTabs}>Comments</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>
                <Card.Body>
                    {(postypes.isLoading || postypes.isIdle) && <Loading type="alert">Loading Request Data...</Loading>}
                    {postypes.isError && <Loading type="alert" isError>Error Loading Request Data</Loading>}
                    {postypes.data &&
                        <>
                            <RequestInfoBox tab={tab} getValues={getValues} posTypes={postypes.data} reqTypes={reqTypes}/>
                            <RequestTabRouter tab={tab} control={control} errors={errors} getValues={getValues} setValue={setValue} posTypes={postypes.data} reqTypes={reqTypes} payBasisTypes={payBasisTypes} apptTypes={apptTypes}/>
                        </>
                    }
                </Card.Body>
                <Card.Footer className="button-group" style={{display:'flex',justifyContent:'right'}}>
                    <Button variant="secondary">Cancel</Button>
                    <Button variant="danger" type="submit" disabled={lockTabs}>Save</Button>
                </Card.Footer>
            </Card>
        </Form>
    );
}

function RequestInfoBox({tab,getValues,posTypes,reqTypes}) {
    if (tab=='information') return null;
    const [effDate,posType,reqType,candidateName] = getValues(['effDate','posType','reqType','candidateName']);
    const reqMap = new Map(reqTypes);
    return (
        <Alert variant="secondary">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Request ID:</Col>
                <Col as="dd" sm={4} className="mb-0">[id]</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0">{format(effDate,'M/d/yyyy')}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{posType} - {posTypes[posType].title}</Col>
                <Col as="dt" sm={2} className="mb-0">Request Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqType} - {reqMap.get(reqType)}</Col>
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
        case "comments": return <p>{tab} tab</p>;
        case "review": return <p>{tab} tab</p>;
        default: return <NotFound/>
    }
}