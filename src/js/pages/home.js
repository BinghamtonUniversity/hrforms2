import React from "react";
import { Link } from "react-router-dom";
import { useUserQueries } from "../queries";
import { Row, Col, Card, ListGroup } from "react-bootstrap";
import { SettingsContext, UserContext} from "../app";
import { News } from "../blocks/news";
import capitalize from "lodash/capitalize";
import get from "lodash/get";

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
                <DashBoardCards />
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

function DashBoardCards() {
    const {getCounts} = useUserQueries();
    const counts = getCounts();
    if (counts.isError) return <p>Error</p>;
    if (counts.isLoading) return <p>Loading...</p>;
    return (
        <>
            {Object.keys(counts.data).map(c => (
                <Col key={c} sm={6} md={5} lg={4}>
                    <Card border="main">
                        <Card.Header className="bg-main text-white"><Link className="text-white" to={`/${c}/list`}>{capitalize(c)}</Link></Card.Header>
                        <ListGroup variant="flush">
                            <SettingsContext.Consumer>
                                {settings=>{
                                    const single = c.slice(0,-1);
                                    return (
                                        <>
                                            <Link key={`${c}.new`} to={`/${single}/`} component={DashBoardListComponent}><span className="font-italic">New {capitalize(single)}</span></Link>
                                            {Object.keys(counts.data[c]).map(l=>{
                                                const key = `${c}.${l}`;
                                                const title = get(settings,`${key}.title`,l);
                                                const show = get(settings,`${key}.showOnHome`,!!l);
                                                const cnt = get(counts.data,key,0);
                                                if (!show) return null;
                                                return <Link key={key} className="d-flex justify-content-between" to={`/${single}/list/${l}`} component={DashBoardListComponent}><span>{title}</span>{cnt}</Link>;
                                            })}
                                        </>
                                    );
                                }}
                            </SettingsContext.Consumer>
                        </ListGroup>
                    </Card>
                </Col>
            ))}
        </>
    );
}

function DashBoardListComponent(props) {
    return (
        <ListGroup.Item className={props.className} href={props.href} action>{props.children}</ListGroup.Item>
    );
}
