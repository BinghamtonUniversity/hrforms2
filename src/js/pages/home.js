import React from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card, ListGroup } from "react-bootstrap";
import { capitalize } from "lodash";
import { UserContext} from "../app";
import { News } from "../blocks/news";
import { MenuCounts } from "../blocks/components";
import { t } from "../config/text";

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
            {({fullname}) => (<Row><Col><h2>{t('home.welcome')} {fullname}</h2></Col></Row>)}
        </UserContext.Consumer>
    );
}

function DashBoardCards() {
    return (
        <>
            {['requests','forms'].map(c => (
                <Col key={c} sm={6} md={5} lg={4}>
                    <Card border="main">
                        <Card.Header className="bg-main text-white"><Link className="text-white" to={`/${c}/list`}>{capitalize(c)}</Link></Card.Header>
                        <ListGroup variant="flush">
                            <MenuCounts menu={c} showOn="home" showNew/>
                        </ListGroup>
                    </Card>
                </Col>
            ))}
        </>
    );
}
