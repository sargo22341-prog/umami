import { mealieApiClient } from "../api/index.ts"
import {
  isScrapedRecipeCandidate,
  type ScrapedRecipeCandidate,
} from "../recipe/recipeScrape.utils.ts"

function parseMealieScrapeResponse(response: unknown): ScrapedRecipeCandidate {
  let parsedResponse: unknown = response

  if (typeof response === "string") {
    const message = response.trim()

    if (!message || message === "recipe_scrapers was unable to scrape this URL") {
      throw new Error("Aucune recette exploitable n'a ete trouvee pour ce lien.")
    }

    try {
      parsedResponse = JSON.parse(message)
    } catch {
      throw new Error(message)
    }
  }

  if (!isScrapedRecipeCandidate(parsedResponse)) {
    throw new Error("Aucune recette exploitable n'a ete trouvee pour ce lien.")
  }

  return parsedResponse
}

export async function fetchMealieScrapeSourceSchema(url: string): Promise<ScrapedRecipeCandidate> {
  const response = await mealieApiClient.post<unknown>("/api/recipes/test-scrape-url", {
    url,
    useOpenAI: false,
  })

  console.log(response)
  return parseMealieScrapeResponse(response)
}
