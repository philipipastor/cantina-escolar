import { randomUUID } from "node:crypto"
import { prisma } from "../src/prisma"
import { anonymous, createClient, PASSWORD, paymentBody, resetDatabase, signIn } from "./helpers"

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
    await admin.patch(`/canteens/${canteenB}`).send({}).expect(400)
    await admin.patch(`/canteens/${canteenB}`).send({ isActive: "não" }).expect(400)
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
    await employee.patch(`/canteens/${canteenA}`).send({ isActive: false }).expect(403)
    await anonymous().post("/canteens").send({ name: "Nova" }).expect(401)
    await anonymous().patch(`/canteens/${canteenA}`).send({ name: "Nova" }).expect(401)

    expect(await prisma.canteen.count()).toBe(2)
  })
})

describe("cantina inativa", () => {
  it("fica só para consulta do administrador e mantém os dados", async () => {
    const admin = await signIn("admin")
    const client = await createClient(admin, canteenA)

    const { body } = await admin.patch(`/canteens/${canteenA}`).send({ isActive: false }).expect(200)
    expect(body.canteen).toMatchObject({ id: canteenA, isActive: false })

    await admin.get(`/canteens/${canteenA}/clients/${client.id}`).expect(200)
    await admin.get(`/canteens/${canteenA}/daily-review`).expect(200)

    const blocked = await admin.post(`/canteens/${canteenA}/clients`).send({ name: "Novo" }).expect(409)
    expect(blocked.body.code).toBe("CANTEEN_INACTIVE")
    await admin.post(`/canteens/${canteenA}/payments`).send(paymentBody(client.id, 1000)).expect(409)

    const list = await admin.get("/canteens").expect(200)
    expect(list.body.canteens).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: canteenA, isActive: false })]),
    )

    // A outra cantina continua funcionando normalmente.
    await createClient(admin, canteenB)
  })

  it("bloqueia o funcionário dela, inclusive quem já estava conectado", async () => {
    const employee = await signIn("emp_a")
    const admin = await signIn("admin")

    await admin.patch(`/canteens/${canteenA}`).send({ isActive: false }).expect(200)

    const denied = await employee.get(`/canteens/${canteenA}/clients`).expect(403)
    expect(denied.body.code).toBe("CANTEEN_INACTIVE")
    const list = await employee.get("/canteens").expect(200)
    expect(list.body.canteens).toEqual([])

    const login = await anonymous().post("/sessions").send({ username: "emp_a", password: PASSWORD })
    expect(login.status).toBe(403)
    expect(login.body.code).toBe("CANTEEN_INACTIVE")

    // Com a senha errada, a resposta continua genérica.
    const wrong = await anonymous().post("/sessions").send({ username: "emp_a", password: "senha-errada-1" })
    expect(wrong.status).toBe(401)

    await signIn("emp_b")
  })

  it("não aceita vincular funcionários a uma cantina inativa", async () => {
    const admin = await signIn("admin")
    await admin.patch(`/canteens/${canteenA}`).send({ isActive: false }).expect(200)

    const user = {
      username: "novo_a",
      name: "Novo",
      password: PASSWORD,
      role: "EMPLOYEE",
      canteenId: canteenA,
    }
    await admin.post("/users").send(user).expect(400)

    const { body } = await admin.get("/users").expect(200)
    const employeeB = body.users.find((item: { username: string }) => item.username === "emp_b")
    await admin.patch(`/users/${employeeB.id}`).send({ canteenId: canteenA }).expect(400)
  })

  it("volta a funcionar ao ser reativada", async () => {
    const admin = await signIn("admin")
    await admin.patch(`/canteens/${canteenA}`).send({ isActive: false }).expect(200)
    await admin.patch(`/canteens/${canteenA}`).send({ isActive: true }).expect(200)

    const employee = await signIn("emp_a")
    await createClient(employee, canteenA)
  })
})
