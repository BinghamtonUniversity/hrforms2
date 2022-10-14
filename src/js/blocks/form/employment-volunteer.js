import React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup} from "react-bootstrap";
import { Icon } from "@iconify/react";
import { DateFormat } from "../components";
import DatePicker from "react-datepicker";

const name = 'employment.separation';

export default function EmploymentSeparation() {
    const { control } = useFormContext();
    const watchEffectiveDate = useWatch({name:'effDate',control:control});
    return (
        <article>
            <Row as="header">
                <Col as="h3">Volunteer</Col>
            </Row>
        </article>
    );
}