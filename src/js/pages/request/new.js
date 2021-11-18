import React,{ useState, lazy, useEffect, useCallback } from "react";
import { Row, Col, Card, Nav, Form, Button, Alert } from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import { useAppQueries } from "../../queries";
import { format } from "date-fns";

/* CONSTANTS */
const resetFields = ['reqType','payBasis','currentGrade','newGrade','reqBudgetTitle'];

/* TABS */
const Information = lazy(()=>import("../../blocks/request/information"));
const Position = lazy(()=>import("../../blocks/request/position"));
const Account = lazy(()=>import("../../blocks/request/account"));
const Comments = lazy(()=>import("../../blocks/request/comments"));

export default function Page() {
    const [tab,setTab] = useState('information');
    const [newReq,setNewReq] = useState(true);
    const [reqTypes,setReqTypes] = useState([]);
    const [payBasisTypes,setPayBasisTypes] = useState([]);

    const { control, handleSubmit, setValue, getValues, formState:{ errors } } = useForm({
        defaultValues:{
            requestId:'',
            posType:'',
            reqType:'',
            effDate:'',
            candidateName:'',
            bNumber:'',
            jobDesc:'',
            lineNumber:'',
            multipleLines:'N',
            numLines:2,
            newLine:false,
            payBasis:'',
            currentGrade:'',
            newGrade:'',
            reqBudgetTitle:'',
            apptStatus:'',
            apptDuration:'',
            apptPeriod:'y',
            tentativeEndDate:'',
            expType:'',
            orgName:'',
            SUNYAccount:'',
            splitAccounts:[],
            comment:''
        }
    });
    const watchPosType = useWatch({name:'posType',control:control});
    const watchReqType = useWatch({name:'reqType',control:control});
    const watchEffDate = useWatch({name:'effDate',control:control});

    const saveRequest = data => {
        console.log(data);
    }

    const {getListData} = useAppQueries();
    //make dependencies? get other data?
    const postypes = getListData('positionTypes',{enabled:false});
    const reqtypes = getListData('requestTypes',{enabled:false});
    const paybasistypes = getListData('payBasisTypes',{enabled:false});
    
    const navigate = e => {
        let target = 'information';
        if (e) {
            e.preventDefault();
            target = e.target.dataset.tab;
        }
        setTab(target);
    }
    
    useEffect(()=>{
        if (watchPosType && reqtypes.data) 
            setReqTypes(reqtypes.data.filter(r=>postypes.data[watchPosType].reqTypes.includes(r[0])));
        if (watchPosType && paybasistypes.data) {
            setPayBasisTypes(paybasistypes.data.filter(p=>postypes.data[watchPosType].payBasisTypes.includes(p[0])));
        }
        for (let f of resetFields) setValue(f,'');
    },[watchPosType]);
    
    useEffect(()=>{
        setNewReq(!(!!watchPosType&&!!watchReqType&&!!watchEffDate)); //toggle tabs enabled/disabled
    },[watchPosType,watchReqType,watchEffDate]);

    useEffect(()=>{
        postypes.refetch();
        reqtypes.refetch();
        paybasistypes.refetch();
    },[]);
    return (
        <>
            <Row>
                <Col>
                    <h2>New Position Request</h2>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form onSubmit={handleSubmit(saveRequest)}>
                        <Card>
                            <Card.Header>
                                <Nav variant="tabs">
                                    <Nav.Item>
                                        <Nav.Link data-tab="information" active={(tab=="information")} onClick={navigate}>Information</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link data-tab="position" active={(tab=="position")} onClick={navigate} disabled={newReq}>Position</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link data-tab="account" active={(tab=="account")} onClick={navigate} disabled={newReq}>Account</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link data-tab="comments" active={(tab=="comments")} onClick={navigate} disabled={newReq}>Comments</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Card.Header>
                            <Card.Body>
                                {(postypes.isLoading||postypes.isIdle||reqtypes.isLoading||reqtypes.isIdle)&&<p>Loading...</p>}
                                {(postypes.data && reqtypes.data) && (
                                    <>
                                        <RequestInfoBoxOLD tab={tab} getValues={getValues} posTypes={postypes.data} reqTypes={reqTypes}/>
                                        <RequestTabRouter 
                                            tab={tab} 
                                            control={control} 
                                            errors={errors} 
                                            getValues={getValues} 
                                            setValue={setValue} 
                                            posTypes={postypes.data} 
                                            reqTypes={reqTypes} 
                                            payBasisTypes={payBasisTypes}
                                        />
                                    </>
                                )}
                            </Card.Body>
                            <Card.Footer style={{display:'flex',justifyContent:'right'}}>
                                <Button variant="secondary">Cancel</Button>
                                <Button variant="danger" type="submit">Save</Button>
                            </Card.Footer>
                        </Card>
                    </Form>
                </Col>
            </Row>
        </>
    );
}

function RequestTabRouter({tab,...rest}) {
    switch(tab) {
        case "information": return <Information {...rest}/>;
        case "position": return <Position {...rest}/>;
        case "account": return <Account {...rest}/>;
        case "comments": return <Comments {...rest}/>;
        default: return <p>Unknown tab</p>;
    }
}

function RequestInfoBoxOLD({tab,getValues,posTypes,reqTypes}) {
    const vals = getValues();
    const reqMap = new Map(reqTypes);
    const reqId = getValues('requestId')||<span className="font-italic">New</span>;
    if (tab == 'information') return null;
    return (
        <Alert variant="secondary">
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Request ID:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqId}</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0">{format(vals.effDate,'M/d/yyyy')}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{vals.posType} - {posTypes[vals.posType].title}</Col>
                <Col as="dt" sm={2} className="mb-0">Request Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{vals.reqType} - {reqMap.get(vals.reqType)}</Col>
                <Col as="dt" sm={2} className="mb-0">Candidate Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{vals.candidateName}</Col>
            </Row>
        </Alert>
    );
}
