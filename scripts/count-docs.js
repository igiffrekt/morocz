import {getCliClient} from 'sanity/cli'

const client = getCliClient()

const query = `{
  "patient": count(*[_type == "patient"]),
  "booking": count(*[_type == "booking"]),
  "service": count(*[_type == "service"]),
  "serviceCategory": count(*[_type == "serviceCategory"]),
  "blogPost": count(*[_type == "blogPost"]),
  "yogaSchedule": count(*[_type == "yogaSchedule"]),
  "yogaInstructor": count(*[_type == "yogaInstructor"]),
  "siteSettings": count(*[_type == "siteSettings"]),
  "homepage": count(*[_type == "homepage"]),
  "yogaPage": count(*[_type == "yogaPage"]),
  "total": count(*[])
}`

const result = await client.fetch(query)
console.log(JSON.stringify(result, null, 2))
