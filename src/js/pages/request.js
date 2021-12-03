import React,{lazy, useEffect, useState} from "react";
import { useParams, useHistory } from "react-router-dom";
import { Row, Col, Form, Card, Nav, Button, Alert } from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import { NotFound } from "../app";
import { useAppQueries, useRequestQueries } from "../queries";
import { Loading } from "../blocks/components";
import format from "date-fns/format";

/* TABS */
const Information = lazy(()=>import("../blocks/request/information"));
const Position = lazy(()=>import("../blocks/request/position"));
const Account = lazy(()=>import("../blocks/request/account"));
const Comments = lazy(()=>import("../blocks/request/comments"));
const Review = lazy(()=>import("../blocks/request/review"));

export default function Request() {
    const [reqId,setReqId] = useState('');
    const [reqData,setReqData] = useState({});
    const [isNew,setIsNew] = useState(false);
    const [error,setError] = useState('');

    const {id,sunyid,ts} = useParams();
    const history = useHistory();

    const {getRequest,postRequest} = useRequestQueries((id=='draft')?`${id}-${sunyid}-${ts}`:(id||''));
    const request = getRequest({enabled:false,select:d => {
        if (d.hasOwnProperty('effDate') && d.effDate != '') d.effDate = new Date(d.effDate);
        if (d.hasOwnProperty('tentativeEndDate') && d.tentativeEndDate != '') d.tentativeEndDate = new Date(d.tentativeEndDate);
        return d;
    }});
    const createRequest = postRequest();

    //if id == 'draft' then get the draft
    //if id then get the PR data
    //else new
    useEffect(() => {
        console.log(id,sunyid,ts);
        if (!id) {
            createRequest.mutateAsync().then(d => {
                setReqData({reqId:d.reqId,SUNYAccounts:[{id:'default-SUNYAccounts',account:'',pct:'100'}]});
                setReqId(d.reqId);
                setIsNew(true);
                history.push(d.reqId.replaceAll('-','/'));
            }).catch(e => {
                setError(e?.description||'Unable to create a new Position Request.');
            });
        } else {
            console.log('refetch:',isNew);
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
            {reqId && <RequestForm reqId={reqId} data={reqData} isNew/>}
            {error && <Loading variant="danger" type="alert" isError>{error}</Loading>}
        </section>
    );
}
//{reqId && <RequestForm reqId={reqId} data={} isNew/>}
function RequestForm({reqId,data,isNew}) {
    const tabs = [
        {id:'information',title:'Information'},
        {id:'position',title:'Position'},
        {id:'account',title:'Account'},
        {id:'comments',title:'Comments'},
        {id:'review',title:'Review'},
    ];

    const [tab,setTab] = useState('information');
    const [lockTabs,setLockTabs] = useState(true);

    const { getListData } = useAppQueries();
    const { handleSubmit, control, getValues, setValue, formState: { errors } } = useForm({
        mode:'onBlur',
        reValidateMode:'onChange',
        defaultValues:data
    });

    const {putRequest,deleteRequest} = useRequestQueries(reqId);
    const updateReq = putRequest();
    const postypes = getListData('posTypes',{enabled:false});

    const watchPosType = useWatch({name:'posType.id',control:control});
    const watchRequired = useWatch({name:['posType.id','reqType.id','effDate'],control:control});

    const navigate = e => {
        setTab(e.target.dataset.tab);
        //need to trigger the save
    }
    const cancelRequest = () => {
        setTab('information');
        console.log('reset form values');
        const formValues = getValues();
        console.log(formValues);
        for (const key in formValues) {
            switch (key) {
                case "SUNYAccounts":
                    setValue(key,[{account:'',pct:'100'}]);
                    break;
                default:
                    setValue(key,'');
            }
        }
    }    
    const saveRequest = (data,e) => {
        // if button is "next" save data to draft table and go to next tab
        // if button is "save draft" save data draft table and exit to home
        // if button is "submit" save data to primary table; and exit to home
        // allow save draft without using sequence; sep table and uuid? or unixds-sunyid
        const eventId = e.nativeEvent.submitter.id;
        if (eventId == 'save_draft' || eventId == 'next') {
            updateReq.mutateAsync({data:data}).then(d => {
                console.log(d);
            });
        }
        if (eventId == 'save_draft') {
            console.log('redirect to home');
        }
        if (eventId == 'next') {
            const nextTabIndex = tabs.findIndex(t=>t.id==tab)+1;
            setTab(tabs[nextTabIndex].id);
        }
    }
    useEffect(() => {
        setLockTabs(!watchRequired.every(a=>!!a));
    },[watchRequired]);
    useEffect(() => {
        if (!watchPosType) return;
        //resetfields:
        ['reqType.id','reqType.title','payBasis.id','payBasis.title','reqBudgetTitle.id','reqBudgetTitle.title',
        'currentGrade','newGrade','apptStatus.id','apptStatus.title','expType'].forEach(f=>setValue(f,''));
    },[watchPosType]);
    useEffect(()=>{
        postypes.refetch();
        Object.keys(data).forEach(k=>setValue(k,data[k]));
    },[reqId]);
    return (
        <Form onSubmit={handleSubmit(saveRequest)}>
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
                            <RequestInfoBox tab={tab} getValues={getValues}/>
                            <RequestTabRouter tab={tab} control={control} errors={errors} getValues={getValues} setValue={setValue} posTypes={postypes.data}/>
                        </>
                    }
                </Card.Body>
                <Card.Footer className="button-group" style={{display:'flex',justifyContent:'right'}}>
                    <Button variant="secondary" onClick={cancelRequest}>Cancel</Button>
                    <Button id="save_draft" type="submit" variant="warning" disabled={lockTabs}>Save Draft</Button>
                    {tab != 'review' && <Button id="next" type="submit" variant="primary" disabled={lockTabs}>Next</Button>}
                    {tab == 'review' && <Button id="submit" type="submit" variant="danger" disabled={lockTabs}>Submit</Button>}
                </Card.Footer>
            </Card>
        </Form>
    );
}

function RequestInfoBox({tab,getValues}) {
    if (tab=='information'||tab=='review') return null;
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