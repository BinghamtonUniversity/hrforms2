import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { Icon } from '@iconify/react';
import { AppButton, DateFormat } from "../components";
import { CommentsTable } from "./comments";
import { useRequestContext } from "../../config/request"

export default function Review() {
    const { getValues } = useFormContext();
    const formValues = getValues();
    const { isDraft, isNew, createdBy } = useRequestContext();

    return (
        <article>
            <Row>
                <Col className="button-group justify-content-end d-print-none">
                    <AppButton format="print" title="Print Page" onClick={()=>window.print()}></AppButton>
                </Col>
            </Row>

            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4 className="border-bottom border-main">Position Request Information</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={3} md={2} className="mb-0">Request ID:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.reqId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Effective Date:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{formValues.effDate}</DateFormat></Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Position Type:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.posType.id} - {formValues.posType.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Request Type:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.reqType.id} - {formValues.reqType.title} </Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Candidate Name:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.candidateName}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">B-Number:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.bNumber}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Job Description:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0"><pre>{formValues.jobDesc}</pre></Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4 className="border-bottom border-main">Position Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={3} md={2} className="mb-0">Line Number:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{formValues.lineNumber}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Multiple Duplicate Lines:</Col>
                    <Col as="dd" sm={9} md={(formValues.multiLines=='Y')?4:10} className="mb-0">{formValues.multiLines}</Col>
                    {formValues.multiLines == 'Y' &&
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Number Of Lines:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{formValues.numLines}</Col>
                    </>
                    }
                    <Col as="dt" sm={3} md={2} className="mb-0">Requested Salary:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.minSalary} - {formValues.maxSalary}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">FTE:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.fte}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Pay Basis:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{formValues.payBasis.id} - {formValues.payBasis.title}</Col>
                    {formValues.posType.id == 'C' && 
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Current Salary Grade:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{formValues.currentGrade}</Col>
                        <Col as="dt" sm={3} md={2} className="mb-0">New Salary Grade:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{formValues.newGrade}</Col>
                    </>
                    }
                    <Col as="dt" sm={3} md={2} className="mb-0">Requested Budget Title:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{formValues.reqBudgetTitle.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Appointment Status:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.apptStatus.title}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Appointment Duration:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0">{formValues.apptDuration} {formValues.apptPeriod}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Tentative End Date:</Col>
                    <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{formValues.tentativeEndDate}</DateFormat></Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4 className="border-bottom border-main">Account Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    {formValues.posType.id == 'F' &&
                        <>
                            <Col as="dt" sm={3} md={2} className="mb-0">Expenditure Type:</Col>
                            <Col as="dd" sm={9} md={4} className="mb-0">{formValues.expType}</Col>
                        </>
                    }
                    <Col as="dt" sm={3} md={2} className="mb-0">Org Name:</Col>
                    <Col as="dd" sm={9} md={(formValues.posType.id == 'F')?4:10} className="mb-0">{formValues.orgName}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">SUNY Account:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">
                        {formValues.SUNYAccounts.map((a,i)=><p className="m-0" key={i}>{a.account[0]?.label} ({a.pct}%)</p>)}
                    </Col>
                </Row>
            </section>
            <section className="mb-4">
                <Row as="header">
                    <Col>
                        <h4 className="border-bottom border-main">Comments</h4>
                    </Col>
                </Row>
                <article>
                    <Row className="mb-0">
                        <Col md={12} className="mb-0">
                            <pre>{formValues.comment}</pre>
                        </Col>
                    </Row>
                </article>
                {!isDraft &&
                    <article className="mb-4">
                        <Row as="header">
                            <Col as="h5">History</Col>
                        </Row>
                        <CommentsTable reqId={formValues.reqId}/>
                    </article>
                }
            </section>
            {(!isDraft&&createdBy) && 
                <section className="mb-4">
                    <Row as="header">
                        <Col>
                            <h4 className="border-bottom border-main">Submitter Information</h4>
                        </Col>
                    </Row>
                    {createdBy && 
                        <Row as="dl" className="mb-0">
                            <Col as="dt" sm={3} md={2} className="mb-0">SUNY ID:</Col>
                            <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.SUNY_ID}</Col>
                            <Col as="dt" sm={3} md={2} className="mb-0">Name:</Col>
                            <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.fullName}</Col>
                            <Col as="dt" sm={3} md={2} className="mb-0">Email:</Col>
                            <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.EMAIL_ADDRESS_WORK}</Col>
                            <Col as="dt" sm={3} md={2} className="mb-0">Department:</Col>
                            <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.REPORTING_DEPARTMENT_NAME}</Col>
                        </Row>
                    }
                </section>
            }
        </article>
    );
}
