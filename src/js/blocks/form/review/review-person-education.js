import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { DateFormat } from "../../components";

export default function ReviewPersonEducation() {
    const { getValues } = useFormContext();
    const [education] = getValues(['person.education.institutions']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Education</Col>
            </Row>
            <Row>
                {education.map((e,i) => (
                    <Col key={i} md={6} className={`mb-md-0 ${(i<education.length-1)?"mb-sm-4":""}`}>
                        <Row as="dl" className="mb-0">
                            <Col as="dt" sm={3} className="mb-0">Degree Date:</Col>
                            <Col as="dd" sm={9} className="mb-0">
                                <DateFormat outFmt="MMM yyyy">{e.awardDate}</DateFormat>{' '}
                                {e.PENDING_DEGREE_FLAG=='Y'&&<span className="font-italic">(pending)</span>}
                            </Col>
                            <Col as="dt" sm={3} className="mb-0">Degree Type:</Col>
                            <Col as="dd" sm={9} className="mb-0">{Object.values(e.DEGREE_TYPE[0]).join(' - ')}</Col>
                            <Col as="dt" sm={3} className="mb-0">Degree Program/Major:</Col>
                            <Col as="dd" sm={9} className="mb-0">{e?.DEGREE_PROGRAM?.at(0)?.label}</Col>
                            <Col as="dt" sm={3} className="mb-0">Degree Specialization:</Col>
                            <Col as="dd" sm={9} className="mb-0">{e?.specialization}</Col>
                            <Col as="dt" sm={3} className="mb-0">Institution Country:</Col>
                            <Col as="dd" sm={9} className="mb-0">{e.COUNTRY_CODE.label}</Col>
                            {(e.COUNTRY_CODE.id=='USA') && 
                                <>
                                    <Col as="dt" sm={3} className="mb-0">Institution City/State:</Col>
                                    <Col as="dd" sm={9} className="mb-0">{e.INSTITUTION_CITY}, {e.INSTITUTION_STATE}</Col>
                                </>
                            }
                            <Col as="dt" sm={3} className="mb-0">Institution:</Col>
                            <Col as="dd" sm={9} className="mb-0">{e.INSTITUTION}</Col>
                            <Col as="dt" sm={3} className="mb-0">Highest Degree:</Col>
                            <Col as="dd" sm={9} className="mb-0">{(e.HIGHEST_DEGREE_FLAG=="Y")?"Yes":"No"}</Col>
                            <Col as="dt" sm={3} className="mb-0">Terminal Degree:</Col>
                            <Col as="dd" sm={9} className="mb-0">{(e.TERMINAL_DEGREE_FLAG=="Y")?"Yes":"No"}</Col>
                            <Col as="dt" sm={3} className="mb-0">Verified Degree:</Col>
                            <Col as="dd" sm={9} className="mb-0">{(e.DEGREE_VERIFIED=="Y")?"Yes":"No"}</Col>
                        </Row>
                    </Col>
                ))}
            </Row>
        </article>
    );
}
