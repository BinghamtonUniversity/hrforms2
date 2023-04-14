import React from "react";
import { useAppQueries } from "../../queries";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { Icon } from "@iconify/react";
import { get } from "lodash";
import { Loading, DepartmentSelector } from "../components";
import DatePicker from "react-datepicker";
import { HRFormContext } from "../../config/form";

const name = 'employment.volunteer';

export default function EmploymentSeparation() {
    const { control, setValue, formState: { errors } } = useFormContext();

    const { getListData } = useAppQueries();
    const subroles = getListData('volunteerSubRoles');
    const servicetypes = getListData('volunteerServiceTypes');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    return (
        <HRFormContext.Consumer>
            {({readOnly}) => (
                <article>
                    <Row as="header">
                        <Col as="h3">Volunteer</Col>
                    </Row>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Sub-Role:</Form.Label>
                        <Col xs="auto">
                            {subroles.isLoading && <Loading>Loading Data</Loading>}
                            {subroles.isError && <Loading isError>Failed to Load</Loading>}
                            {subroles.data &&
                                <Controller
                                    name={`${name}.subRole.id`}
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                            <option></option>
                                            {subroles.data.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Start Date:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.startDate`}
                                    control={control}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        selected={field.value}
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
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>End Date:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.endDate`}
                                    control={control}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        selected={field.value}
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
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Hours/Week:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.hoursPerWeek`}
                                defaultValue="1"
                                control={control}
                                rules={{min:{value:1,message:'Hours/Week cannot be less than 1'},max:{value:40,message:'Hours/Week cannot be greater than 40'}}}
                                render={({field}) => <Form.Control {...field} type="number" min={1} max={40} isInvalid={get(errors,field.name,false)} disabled={readOnly}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(errors,`${name}.hoursPerWeek.message`,'')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Sub-Role:</Form.Label>
                        <Col xs="auto">
                            {servicetypes.isLoading && <Loading>Loading Data</Loading>}
                            {servicetypes.isError && <Loading isError>Failed to Load</Loading>}
                            {servicetypes.data &&
                                <Controller
                                    name={`${name}.serviceType.id`}
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                            <option></option>
                                            {servicetypes.data.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Department:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.department.id`}
                                control={control}
                                defaultValue=""
                                render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={readOnly}/>}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Duties:</Form.Label>
                        <Col xs={12} sm={10} md={8} lg={6}>
                            <Controller
                                name={`${name}.duties`}
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} as="textarea" rows={4} disabled={readOnly}/>}
                            />
                        </Col>
                    </Form.Group>
                </article>
            )}
        </HRFormContext.Consumer>
    );
}