import React from "react";
import { useFormContext } from "react-hook-form";
import { Row, Col } from "react-bootstrap";
import { DateFormat } from "../../components";
import { NewLine } from "../review";

export default function ReviewEmploymentVolunteer() {
    const { getValues } = useFormContext();
    const [info] = getValues(['employment.volunteer']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Volunteer</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} md={2} className="mb-0">Sub-Role:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{info.subRole?.label}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Start Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{info.startDate}</DateFormat></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">End Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{info.endDate}</DateFormat></Col>
                {info.subRole.id=='Instructor' &&
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Tenure Status:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{info.tenureStatus?.label}</Col>
                    </>
                }
                <Col as="dt" sm={3} md={2} className="mb-0">Hours/Week:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{info.hoursPerWeek}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Service Type:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{info.serviceType?.label}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Department:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{info.department?.label}</Col>
                {(info.subRole.id&&info.subRole.id.startsWith('CP')) && 
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Responsible Univ Official:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{info.univOfficial[0]?.label}</Col>
                    </>
                }
                {(info.subRole.id&&!info.subRole.id.startsWith('CP')) && 
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Supervisor:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{info.supervisor[0]?.label}</Col>
                    </>
                }
                <NewLine gap={2}/>
                <Col as="dt" sm={3} md={2} className="mb-0">Duties:</Col>
                <Col as="dd" sm={9} md={10} className="mb-0"><pre>{info.duties}</pre></Col>
            </Row>
        </article>
    );
}