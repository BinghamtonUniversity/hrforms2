import React from "react";
import { Row, Col, Alert } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Icon } from '@iconify/react';

export default function Review({isNew}) {
    const {getValues} = useFormContext();
    const formValues = getValues();
    return (
        <>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Position Request Information</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" md={2} className="mb-0">Request ID:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.reqId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                    <Col as="dt" md={2} className="mb-0">Effective Date:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.effDate && format(formValues.effDate,'M/d/yyyy')}</Col>
                    <Col as="dt" md={2} className="mb-0">Position Type:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.posType.id} - {formValues.posType.title}</Col>
                    <Col as="dt" md={2} className="mb-0">Request Type:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.reqType.id} - {formValues.reqType.title} </Col>
                    <Col as="dt" md={2} className="mb-0">Candidate Name:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.candidateName}</Col>
                    <Col as="dt" md={2} className="mb-0">B-Number:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.bNumber}</Col>
                    <Col as="dt" md={2} className="mb-0">Job Description:</Col>
                    <Col as="dd" md={10} className="mb-0"><pre>{formValues.jobDesc}</pre></Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Position Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" md={2} className="mb-0">Line Number:</Col>
                    <Col as="dd" md={10} className="mb-0">{formValues.lineNumber}</Col>
                    <Col as="dt" md={2} className="mb-0">Multiple Duplicate Lines:</Col>
                    <Col as="dd" md={(formValues.multiLines=='Y')?4:10} className="mb-0">{formValues.multiLines}</Col>
                    {formValues.multiLines == 'Y' &&
                    <>
                        <Col as="dt" md={2} className="mb-0">Number Of Lines:</Col>
                        <Col as="dd" md={4} className="mb-0">{formValues.numLines}</Col>
                    </>
                    }
                    <Col as="dt" md={2} className="mb-0">Requested Salary:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.minSalary} - {formValues.maxSalary}</Col>
                    <Col as="dt" md={2} className="mb-0">FTE:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.fte}</Col>
                    <Col as="dt" md={2} className="mb-0">Pay Basis:</Col>
                    <Col as="dd" md={10} className="mb-0">{formValues.payBasis.id} - {formValues.payBasis.title}</Col>
                    {formValues.posType.id == 'C' && 
                    <>
                        <Col as="dt" md={2} className="mb-0">Current Salary Grade:</Col>
                        <Col as="dd" md={4} className="mb-0">{formValues.currentGrade}</Col>
                        <Col as="dt" md={2} className="mb-0">New Salary Grade:</Col>
                        <Col as="dd" md={4} className="mb-0">{formValues.newGrade}</Col>
                    </>
                    }
                    <Col as="dt" md={2} className="mb-0">Requested Budget Title:</Col>
                    <Col as="dd" md={10} className="mb-0">{formValues.reqBudgetTitle.title}</Col>
                    <Col as="dt" md={2} className="mb-0">Appointment Status:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.apptStatus.title}</Col>
                    <Col as="dt" md={2} className="mb-0">Appointment Duration:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.apptDuration} {formValues.apptPeriod}</Col>
                    <Col as="dt" md={2} className="mb-0">Tentative End Date:</Col>
                    <Col as="dd" md={4} className="mb-0">{formValues.tentativeEndDate && format(formValues.tentativeEndDate,'M/d/yyyy')}</Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Account Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    {formValues.posType.id == 'F' &&
                        <>
                            <Col as="dt" md={2} className="mb-0">Expenditure Type:</Col>
                            <Col as="dd" md={4} className="mb-0">{formValues.expType}</Col>
                        </>
                    }
                    <Col as="dt" md={2} className="mb-0">Org Name:</Col>
                    <Col as="dd" md={(formValues.posType.id == 'F')?4:10} className="mb-0">{formValues.orgName}</Col>
                    <Col as="dt" md={2} className="mb-0">SUNY Account:</Col>
                    <Col as="dd" md={10} className="mb-0">
                        {formValues.SUNYAccounts.map((a,i)=><p className="m-0" key={i}>{a.account[0]?.label} ({a.pct}%)</p>)}
                    </Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Comments</h4>
                        </Col>
                    </Row>
                </header>
                <Row className="mb-0">
                    <Col md={12} className="mb-0">
                        <pre>{formValues.comment}</pre>
                    </Col>
                </Row>
            </section>
        </>
    );
}
