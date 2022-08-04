import React from "react";
import { useAppQueries } from "../../queries";
import { useFormContext, Controller } from "react-hook-form";
import { Row, Col, Form } from "react-bootstrap";

export default function PersonInfo() {
    const { control, formState: { errors } } = useFormContext();

    const {getListData} = useAppQueries();
    const salutations = getListData('salutations');

    return (
        <>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Identification</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>SUNY ID:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.sunyId"
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>B-Number:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.bNumber"
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
            </article>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Name</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Salutation:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.salutation"
                            control={control}
                            render={({field})=>(
                            <Form.Control {...field} as="select">
                                <option></option>
                                {salutations.data && salutations.data.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
                            </Form.Control>)}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>First Name:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.firstName"
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Middle Name:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.middleName"
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Last Name:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.lastName"
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Suffix:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.suffix"
                            control={control}
                            render={({field})=><Form.Control {...field} type="text"/>}
                        />
                    </Col>
                </Form.Group>
            </article>
            <article className="mt-3">
                <Row as="header">
                    <Col as="h3">Additional Information</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Volunteer Firefighter/EMT:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.volFFEMT"
                            defaultValue="No"
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Rehire Retiree:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="person.info.rehireRetiree"
                            defaultValue="No"
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="Yes" value='Yes' checked={field.value=='Yes'}/>
                                    <Form.Check {...field} inline type="radio" label="No" value='No' checked={field.value=='No'}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
            </article>
        </>
    );
}