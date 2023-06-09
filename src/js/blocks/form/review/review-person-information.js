import React from "react";
import { useFormContext } from "react-hook-form";
import { Row, Col } from "react-bootstrap";

export default function ReviewPersonInformation() {
    const { getValues } = useFormContext();
    const [info] = getValues(['person.information']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Information</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" md={2} className="mb-0">SUNY ID:</Col>
                <Col as="dd" md={4} className="mb-0">{info.SUNY_ID}</Col>
                <Col as="dt" md={2} className="mb-0">B#:</Col>
                <Col as="dd" md={4} className="mb-0">{info.LOCAL_CAMPUS_ID}</Col>
                <Col as="dt" md={2} className="mb-0">Name:</Col>
                <Col as="dd" md={4} className="mb-0">{[info.SALUTATION_CODE.label,info.LEGAL_FIRST_NAME,info.LEGAL_MIDDLE_NAME,info.LEGAL_LAST_NAME,info.SUFFIX_CODE].join(' ')}</Col>
                <Col as="dt" md={2} className="mb-0">Preferred First Name:</Col>
                <Col as="dd" md={4} className="mb-0">{info.ALIAS_FIRST_NAME}</Col>
                <Col as="dt" md={2} className="mb-0">Vol FF/EMT:</Col>
                <Col as="dd" md={4} className="mb-0">{(info.VOLUNTEER_FIRE_FLAG=="1")?"Yes":"No"}</Col>
                <Col as="dt" md={2} className="mb-0">Rehire Retiree:</Col>
                <Col as="dd" md={4} className="mb-0">{(info.REHIRE_RETIREE=="1")?"Yes":"No"}</Col>
                {(info.REHIRE_RETIREE=="1")&&
                    <>
                        <Col as="dt" md={2} className="mb-0">Retired Date:</Col>
                        <Col as="dd" md={4} className="mb-0"><DateFormat>{info.retiredDate}</DateFormat></Col>
                        <Col as="dt" md={2} className="mb-0">Retired From:</Col>
                        <Col as="dd" md={4} className="mb-0">{info.RETIRED_FROM}</Col>
                    </>
                }
            </Row>
        </article>
    );
}