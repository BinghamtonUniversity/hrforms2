import React from "react";
import { Row, Col } from "react-bootstrap";
import { format } from "date-fns";

export default function Review(props) {
    return (
        <section>
            <header>
                <Row>
                    <Col><h3>Final Review</h3></Col>
                </Row>
                <Row>
                    <Col>
                        <p>Review the information below for accuracy and correctness. When you are satisfied everything is correct you may click the submit button at the bottom.</p>
                    </Col>
                </Row>
            </header>
            <ReviewInformation {...props}/>
            <ReviewPosition {...props}/>
        </section>
    );
}

function ReviewInformation({getValues}) {
    const [posType,reqType,effDate,candidateName,bNumber] = getValues(['posType','reqType','effDate','candidateName','bNumber']);
    return (
        <article className="mb-4">
            <header>
                <Row>
                    <Col>
                        <h4>Position Request Information</h4>
                    </Col>
                </Row>
            </header>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Request ID:</Col>
                <Col as="dd" sm={4} className="mb-0">[id]</Col>
                <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={4} className="mb-0">{format(effDate,'M/d/yyyy')}</Col>
                <Col as="dt" sm={2} className="mb-0">Position Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{posType.id} - {posType.title}</Col>
                <Col as="dt" sm={2} className="mb-0">Request Type:</Col>
                <Col as="dd" sm={4} className="mb-0">{reqType.id} - {reqType.title} </Col>
                <Col as="dt" sm={2} className="mb-0">Candidate Name:</Col>
                <Col as="dd" sm={4} className="mb-0">{candidateName}</Col>
                <Col as="dt" sm={2} className="mb-0">B-Number:</Col>
                <Col as="dd" sm={4} className="mb-0">{bNumber}</Col>
            </Row>
        </article>
    );
}

function ReviewPosition({getValues}) {
    return (
        <article className="mb-4">
            <header>
                <Row>
                    <Col>
                        <h4>Position Data</h4>
                    </Col>
                </Row>
            </header>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">Line Number:</Col>
                <Col as="dd" sm={4} className="mb-0">[line #]</Col>
            </Row>
        </article>
    );
}