import { prisma } from "../src/prisma"
import { createProduct, resetDatabase, signIn, type Api } from "./helpers"

let canteenA: string
let canteenB: string
let api: Api
let base: string

beforeEach(async () => {
  ;({ canteenA, canteenB } = await resetDatabase())
  api = await signIn("emp_a")
  base = `/canteens/${canteenA}/products`
})

afterAll(() => prisma.$disconnect())

const names = (body: { products: { name: string }[] }) => body.products.map((product) => product.name)

describe("produtos para as telas", () => {
  it("lista só os ativos por padrão, e todos com active=all", async () => {
    await createProduct(api, canteenA, "Café", 1890)
    const leite = await createProduct(api, canteenA, "Leite", 650)
    await api.patch(`${base}/${leite.id}`).send({ isActive: false }).expect(200)

    const standard = await api.get(base).expect(200)
    expect(names(standard.body)).toEqual(["Café"])

    const inactive = await api.get(base).query({ active: "false" }).expect(200)
    expect(names(inactive.body)).toEqual(["Leite"])

    const all = await api.get(base).query({ active: "all" }).expect(200)
    expect(names(all.body).sort()).toEqual(["Café", "Leite"])

    await api.get(base).query({ active: "talvez" }).expect(400)
  })

  it("busca um produto pelo id, só dentro da própria cantina", async () => {
    const cafe = await createProduct(api, canteenA, "Café", 1890)

    const { body } = await api.get(`${base}/${cafe.id}`).expect(200)
    expect(body.product).toMatchObject({ name: "Café", priceCents: 1890, isActive: true })

    const admin = await signIn("admin")
    await admin.get(`/canteens/${canteenB}/products/${cafe.id}`).expect(404)

    const otherEmployee = await signIn("emp_b")
    await otherEmployee.get(`${base}/${cafe.id}`).expect(403)
  })
})
