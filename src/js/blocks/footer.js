import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import { useAuthContext } from "../app";
import { DateFormat } from "./components";

export default function Footer() {
    const [currYear,setCurrYear] = useState('');
    const { pathname } = useLocation();
    const { LAST_LOGIN_DATE, LAST_IP_ADDRESS, INSTANCE, VERSION,REVISION, DEBUG } = useAuthContext();
    useEffect(()=>setCurrYear(new Date().getFullYear()),[]);
    return (
        <footer className="mt-4 mb-2">
            <Row className={((INSTANCE!="PROD")?"bg-primary":"bg-main") + " text-white py-1 mb-1 mr-0"}>
                <Col className="d-flex justify-content-center">&copy; 2021 - {currYear} Binghamton University</Col>
            </Row>
            <Row className="mr-0">
                <Col className="d-flex justify-content-center"><small><Link to="/login-history">Last Login</Link>: <DateFormat inFmt="t" outFmt="E, MMM d, yyyy h:mm a" nvl={<span className="font-italic">Never</span>}>{LAST_LOGIN_DATE}</DateFormat> {LAST_IP_ADDRESS && `from ${LAST_IP_ADDRESS}`}</small></Col>
            </Row>
            <Row className="mr-0">
                <Col className="d-flex justify-content-center"><small><Link to="/version-info">Version</Link>: {VERSION} ({REVISION})</small></Col>
            </Row>
            <Row className="py-3 d-none d-print-block mr-0">
                <Col className="d-flex justify-content-center"><small>[{INSTANCE}]:{pathname}</small></Col>
            </Row>
            {DEBUG && 
                <Row className="mr-0">
                    <Col>
                        <p className="text-muted d-block d-sm-none">xs</p>
                        <p className="text-muted d-none d-sm-block d-md-none">sm</p>
                        <p className="text-muted d-none d-md-block d-lg-none">md</p>
                        <p className="text-muted d-none d-lg-block d-xl-none">lg</p>
                        <p className="text-muted d-none d-xl-block">xl</p>
                    </Col>
                </Row>
            }
        </footer>
    );
}
