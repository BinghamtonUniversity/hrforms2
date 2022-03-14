import React, { useState, useEffect } from "react";
import {Link,useLocation} from "react-router-dom";
import {Row,Col} from "react-bootstrap";
import {AuthContext} from "../app";
import {DateFormat} from "./components";

export default function Footer() {
    const [currYear,setCurrYear] = useState('');
    const {pathname} = useLocation();
    useEffect(()=>setCurrYear(new Date().getFullYear()),[]);
    return (
        <AuthContext.Consumer>
            {({LAST_LOGIN_DATE,LAST_IP_ADDRESS,INSTANCE,VERSION,REVISION}) => (
                <footer className="mt-4 mb-2">
                    <Row className="bg-main text-white py-1 mb-1">
                        <Col className="d-flex justify-content-center">&copy; 2021 - {currYear} Binghamton University</Col>
                    </Row>
                    <Row>
                        <Col className="d-flex justify-content-center"><small><Link to="/login-history">Last Login: </Link><DateFormat inFmt="t" outFmt="E, MMM d, yyyy h:mm a" nvl={<span className="font-italic">Never</span>}>{LAST_LOGIN_DATE}</DateFormat> {LAST_IP_ADDRESS && `from ${LAST_IP_ADDRESS}`}</small></Col>
                    </Row>
                    <Row>
                        <Col className="d-flex justify-content-center"><small><Link to="/version-info">version:</Link> {VERSION} ({REVISION})</small></Col>
                    </Row>
                    <Row className="py-3 d-none d-print-block">
                        <Col className="d-flex justify-content-center"><small>[{INSTANCE}]:{pathname}</small></Col>
                    </Row>
                    <Row>
                        <Col>
                            <p className="text-muted d-block d-sm-none">xs</p>
                            <p className="text-muted d-none d-sm-block d-md-none">sm</p>
                            <p className="text-muted d-none d-md-block d-lg-none">md</p>
                            <p className="text-muted d-none d-lg-block d-xl-none">lg</p>
                            <p className="text-muted d-none d-xl-block">xl</p>
                        </Col>
                    </Row>
                </footer>
            )}
        </AuthContext.Consumer>
    );
}
