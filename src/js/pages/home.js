import React, {useState,useEffect} from "react";
import {Link} from "react-router-dom";
import {useUserQueries} from "../queries";
import {Row,Col,Card,ListGroup,ListGroupItem} from "react-bootstrap";
import {UserContext} from "../app";
import {News} from "../blocks/news";

export default function Page() {
    return (
        <>
            <Welcome/>
            <Row>
                <Col>
                    <News/>
                </Col>
            </Row>
            <Row>
                <UserContext.Consumer>
                    {({SUNY_ID})=><DashBoardCards SUNY_ID={SUNY_ID}/>}
                </UserContext.Consumer>
            </Row>
        </>
    );
}

function Welcome() {
    return (
        <UserContext.Consumer>
            {({fullname}) => (<Row><Col><h2>Welcome {fullname}</h2></Col></Row>)}
        </UserContext.Consumer>
    );
}

function DashBoardCards({SUNY_ID}) {
    const [requests,setRequests] = useState(new Map());
    const [forms,setForms] = useState(new Map());
    const {getCounts} = useUserQueries(SUNY_ID);
    const counts = getCounts();
    useEffect(() => {
        if (counts.data) {
            if (counts.data.requests) setRequests(new Map(Object.entries(counts.data.requests)));
            if (counts.data.forms) setForms(new Map(Object.entries(counts.data.forms)));
        }
    },[counts.data]);
    if (counts.isLoading||counts.isError) return <Col><p>Loading....</p></Col>;
    return (
        <>
            {(requests.size > 0) && 
            <Col sm={6} md={5} lg={4}>
                <Card border="main">
                    <Card.Header className="bg-main text-white"><Link className="text-white" to="/request/list">Requests</Link></Card.Header>
                    <ListGroup variant="flush">
                        <Link to="/request/" component={DashBoardListComponent}><span className="font-italic">New Request</span></Link>
                        {requests.has('draft') && <Link className="d-flex justify-content-between" to="/request/list/draft" component={DashBoardListComponent}><span>Drafts</span>{requests.get('draft')}</Link>}
                        {requests.has('approval') && <Link className="d-flex justify-content-between" to="/request/list/approvals" component={DashBoardListComponent}><span>Approvals</span>{requests.get('approval')}</Link>}
                        {requests.has('final') && <Link className="d-flex justify-content-between" to="/request/list/final" component={DashBoardListComponent}><span>Final Approvals</span>{requests.get('final')}</Link>}
                    </ListGroup>
                </Card>                
            </Col>
            }
            {(forms.size > 0) && 
            <Col sm={6} md={5} lg={4}>
                <Card border="main">
                    <Card.Header className="bg-main text-white"><Link className="text-white" to="/forms/list">Forms</Link></Card.Header>
                    <ListGroup variant="flush">
                        <Link to="/form/new" component={DashBoardListComponent}><span className="font-italic">New Form</span></Link>
                        {forms.has('draft') && <Link className="d-flex justify-content-between" to="/form/list/drafts" component={DashBoardListComponent}><span>Drafts</span>{forms.get('draft')}</Link>}
                        {forms.has('rejection') && <Link className="d-flex justify-content-between" to="/form/list/rejections" component={DashBoardListComponent}><span>Rejections</span>{forms.get('rejection')}</Link>}
                        {forms.has('approval') && <Link className="d-flex justify-content-between" to="/form/list/approvals" component={DashBoardListComponent}><span>Approvals</span>{forms.get('approval')}</Link>}
                        {forms.has('final') && <Link className="d-flex justify-content-between" to="/form/list/final" component={DashBoardListComponent}><span>Final Approvals</span>{forms.get('final')}</Link>}
                    </ListGroup>
                </Card>                
            </Col>
            }
        </>
    );
}

function DashBoardListComponent(props) {
    return (
        <ListGroup.Item className={props.className} href={props.href} action>{props.children}</ListGroup.Item>
    );
}
/*
function DashBoardCards() {
    return (
        <GlobalContext.Consumer>
            {({navTerms}) => {
                return (
                <UserContext.Consumer>
                    {({requests,forms}) => {
                        return [{requests},{forms}].map(d => {
                            const k = Object.keys(d)[0];
                            return (
                                <Col key={k} sm={6}>
                                    <Card border="main">
                                        <Card.Header className="bg-main text-white">{navTerms[k].title}s</Card.Header>
                                        <ListGroup variant="flush">
                                            <ListGroupItem><em>New {navTerms[k].title}</em></ListGroupItem>
                                            <ListGroupItem>Drafts...</ListGroupItem>
                                        </ListGroup>
                                    </Card>
                                </Col>
                            );
                        });
                    }}
                </UserContext.Consumer>
            );}}
        </GlobalContext.Consumer>
    );
}
*/