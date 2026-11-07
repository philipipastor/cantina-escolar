import { randomUUID } from "node:crypto"
import request from "supertest"
import { app } from "../src/app"
import { prisma } from "../src/prisma"
import { createClient, PASSWORD, resetDatabase, signIn } from "./helpers"

let canteenA: string
let canteenB: string

beforeEach(async () => {
  ;({ canteenA, canteenB } = await resetDatabase())
})

afterAll(() => prisma.$disconnect())

describe("cadastro de cantinas", () => {
  it("o administrador cria uma cantina que já pode ser usada", async () => {
    const admin = await signIn("admin")

    const { body } = await admin.post("/canteens").send({ name: "  Cantina Central  " }).expect(201)
    const { id, name } = body.canteen
    expect(name).toBe("Cantina Central")

    const list = await admin.get("/canteens").expect(200)
    expect(list.body.canteens.map((canteen: { id: string }) => canteen.id)).toContain(id)

    const client = await createClient(admin, id)
    await admin.get(`/canteens/${id}/clients/${client.id}`).expect(200)

    const dashboard = await admin.get("/dashboard").expect(200)
    expect(JSON.stringify(dashboard.body)).toContain(id)

    await admin
      .post("/users")
      .send({
        username: "emp_central",
        name: "Funcionário Central",
        password: PASSWORD,
        role: "EMPLOYEE",
        canteenId: id,
      })
      .expect(201)
    const employee = await signIn("emp_central")
    await employee.get(`/canteens/${id}/clients`).expect(200)
    await employee.get(`/canteens/${canteenA}/clients`).expect(403)
  })

  it("renomear não mexe nos dados da cantina", async () => {
    const admin = await signIn("admin")
    const client = await createClient(admin, canteenA)

    const { body } = await admin.patch(`/canteens/${canteenA}`).send({ name: "Cantina Nova" }).expect(200)

    expect(body.canteen).toMatchObject({ id: canteenA, name: "Cantina Nova" })
    await admin.get(`/canteens/${canteenA}/clients/${client.id}`).expect(200)
  })

  it("não aceita nome vazio, repetido ou campos a mais", async () => {
    const admin = await signIn("admin")

    await admin.post("/canteens").send({ name: "   " }).expect(400)
    await admin.post("/canteens").send({}).expect(400)
    await admin.post("/canteens").send({ name: "Outra", id: randomUUID() }).expect(400)
    await admin.post("/canteens").send({ name: "cantina a" }).expect(409)
    await admin.patch(`/canteens/${canteenB}`).send({ name: "CANTINA A" }).expect(409)
  })

  it("permite ajustar as maiúsculas do próprio nome", async () => {
    const admin = await signIn("admin")

    await admin.patch(`/canteens/${canteenA}`).send({ name: "CANTINA A" }).expect(200)
  })

  it("responde 404 para cantina inexistente", async () => {
    const admin = await signIn("admin")

    await admin.patch(`/canteens/${randomUUID()}`).send({ name: "Nova" }).expect(404)
  })

  it("só o administrador cria e renomeia", async () => {
    const employee = await signIn("emp_a")

    await employee.post("/canteens").send({ name: "Nova" }).expect(403)
    await employee.patch(`/canteens/${canteenA}`).send({ name: "Nova" }).expect(403)
    await request(app).post("/canteens").send({ name: "Nova" }).expect(401)
    await request(app).patch(`/canteens/${canteenA}`).send({ name: "Nova" }).expect(401)

    expect(await prisma.canteen.count()).toBe(2)
  })
})
