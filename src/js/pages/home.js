import React, { useMemo } from "react";
import { Row, Col, Card, ListGroup } from "react-bootstrap";
import { get } from "lodash";
import { useAuthContext, useSettingsContext, useUserContext} from "../app";
import { News } from "../blocks/news";
import { MenuCounts } from "../blocks/components";
import { t } from "../config/text";
import { Helmet } from "react-helmet";

export default function Page() {
    return (
        <>
            <Welcome/>
            <Row>
                <Col>
                    <News/>
                </Col>
            </Row>
            <DashBoardCards/>
        </>
    );
}

function Welcome() {
    const { OVR_SUNY_ID } = useAuthContext();
    const { fullname } = useUserContext();
    const title = useMemo(() => {
        return `${t('home.welcome')} ${fullname} ${((!OVR_SUNY_ID)?'':'[IMPERSONATING]')}`;
    },[OVR_SUNY_ID,fullname]);
    return (
        <header>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <Row>
                <Col><h2>{t('home.welcome')} {fullname}</h2></Col>
            </Row>
        </header>
    );
}

function DashBoardCards() {
    const { isViewer } = useUserContext();
    const settings = useSettingsContext();
    return (
        <Row>
            {['requests','forms'].map(c => (
                <Col key={c} sm={6} md={5} lg={4}>
                    <Card border="main">
                        <Card.Header className="bg-main text-white">{get(settings,`${c}.dashboardTitle`,'Title')}</Card.Header>
                        <ListGroup variant="flush">
                            <MenuCounts menu={c} showOn="home" showNew={!isViewer} isViewer={isViewer}/>
                        </ListGroup>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
