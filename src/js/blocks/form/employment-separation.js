import React, { useEffect, useRef } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup} from "react-bootstrap";
import { Icon } from "@iconify/react";
import { DateFormat } from "../components";
import DatePicker from "react-datepicker";
import { subDays } from "date-fns";
import { useHRFormContext } from "../../config/form";
import { get } from "lodash";

const name = 'employment.separation';

export default function EmploymentSeparation() {
    const { canEdit, activeNav } = useHRFormContext();
    const ref = useRef();

    const { control, formState: { errors } } = useFormContext();
    const watchEffectiveDate = useWatch({name:'effDate',control:control});

    useEffect(()=>(canEdit&&ref.current)&&ref.current.setFocus(),[activeNav]);

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
                                ref={ref}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                maxDate={(watchEffectiveDate&&subDays(watchEffectiveDate,1))}
                                autoComplete="off"
                                disabled={!canEdit}
                                isInvalid={!!get(errors,field.name,false)}
                            />}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    {get(errors,`${name}.lastDateWorked.message`,false)&&
                        <Form.Control.Feedback type="invalid" style={{display:'block'}}>{get(errors,`${name}.lastDateWorked.message`,'')}</Form.Control.Feedback>
                    }
                </Col>
            </Form.Group>
       </article>
    );
}