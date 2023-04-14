import React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup} from "react-bootstrap";
import { Icon } from "@iconify/react";
import { DateFormat } from "../components";
import DatePicker from "react-datepicker";
import { subDays } from "date-fns";
import { useHRFormContext } from "../../config/form";

const name = 'employment.separation';

export default function EmploymentSeparation() {
    const { control } = useFormContext();
    const { readOnly } = useHRFormContext();
    const watchEffectiveDate = useWatch({name:'effDate',control:control});
    return (
        <article>
            <Row as="header">
                <Col as="h3">Separation</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Effective Date:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <DateFormat nvl="Effective Date Not Set">{watchEffectiveDate}</DateFormat>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Last Date Worked:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.lastDateWorked`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value||(watchEffectiveDate&&subDays(watchEffectiveDate,1))}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                autoComplete="off"
                                disabled={readOnly}
                            />}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Col>
            </Form.Group>
       </article>
    );
}