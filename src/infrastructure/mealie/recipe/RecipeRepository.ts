// RecipeRepository.ts

import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealiePaginatedRecipes, MealieRawPaginatedRecipes, MealieRecipeOutput, RecipeFilters, RecipeFormData } from "@/shared/types/mealie/Recipes.ts"

// type
import type { Season } from "@/shared/types/Season.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"

// utils
import { isSeasonTag } from "@/shared/utils/season.ts"
import { isCalorieTag, buildCalorieTag } from "@/shared/utils/calorie.ts"
import { equalsNormalizedText } from "@/shared/utils/text.ts"

// api client utils
import { mealieApiClient } from "../api/index.ts"
import { ORDER_BY_MAP, buildRecipeUpdatePayload, resolveSeasonTags } from "./recipe.helpers.ts"

// Import pour calorie tag management
import { TagRepository } from "../tags/TagRepository.ts"

const tagRepository = new TagRepository()

export class RecipeRepository implements IRecipeRepository {
  async getAll(
    page = 1,
    perPage = 30,
    filters: RecipeFilters = {},
  ): Promise<MealiePaginatedRecipes> {
    const paginationSeed = filters.paginationSeed?.trim() || Date.now().toString()
    const orderByValue = filters.orderBy !== undefined
      ? ORDER_BY_MAP[filters.orderBy] ?? String(filters.orderBy)
      : undefined

    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      search: filters.search?.trim() ?? "",
      paginationSeed,
      searchSeed: paginationSeed,
      requireAllCategories: "false",
      requireAllFoods: "false",
      requireAllTags: "false",
      requireAllTools: "false",
    })

    if (filters.categories?.length) {
      filters.categories.forEach((category) => params.append("categories", category))
      params.set("requireAllCategories", "true")
    }

    if (filters.foods?.length) {
      filters.foods.forEach((food) => params.append("foods", food))
      params.set("requireAllFoods", "true")
    }

    if (filters.tags?.length) {
      filters.tags.forEach((tag) => params.append("tags", tag))
      params.set("requireAllTags", "true")
    }

    if (filters.tools?.length) {
      filters.tools.forEach((tool) => params.append("tools", tool))
      params.set("requireAllTools", "true")
    }

    if (orderByValue !== undefined) {
      params.set("orderBy", orderByValue)
      params.set("orderByNullPosition", "last")
    }

    if (filters.orderDirection !== undefined) {
      params.set("orderDirection", String(filters.orderDirection))
    }

    const raw = await mealieApiClient.get<MealieRawPaginatedRecipes>(
      `/api/recipes?${params.toString()}`,
    )

    return {
      items: raw.items,
      total: raw.total,
      page: raw.page,
      perPage: raw.per_page,
      totalPages: raw.total_pages,
    }
  }

  async getBySlug(slug: string): Promise<MealieRecipeOutput> {
    return mealieApiClient.get<MealieRecipeOutput>(`/api/recipes/${slug}`)
  }

  async create(name: string): Promise<string> {
    const response = await mealieApiClient.post<string | { slug: string }>("/api/recipes", { name })
    return typeof response === "string" ? response : response.slug
  }

  async delete(slug: string): Promise<void> {
    await mealieApiClient.delete(`/api/recipes/${slug}`)
  }

  async update(slug: string, data: RecipeFormData): Promise<MealieRecipeOutput> {
    const current = await this.getBySlug(slug)
    const payload = await buildRecipeUpdatePayload(current, data)
    return mealieApiClient.put<MealieRecipeOutput>(`/api/recipes/${slug}`, payload)
  }

  async updateCategories(slug: string, categories: MealieRecipeCategory[]): Promise<MealieRecipeOutput> {
    const current = await this.getBySlug(slug)

    return mealieApiClient.patch<MealieRecipeOutput>(`/api/recipes/${slug}`, {
      name: current.name,
      recipeCategory: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    })
  }

  async updateTags(slug: string, tags: MealieRecipeTag[]): Promise<MealieRecipeOutput> {
    const current = await this.getBySlug(slug)

    return mealieApiClient.patch<MealieRecipeOutput>(`/api/recipes/${slug}`, {
      name: current.name,
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
    })
  }

  async updateSeasons(slug: string, seasons: Season[]): Promise<MealieRecipeOutput> {
    const [current, seasonTags] = await Promise.all([
      this.getBySlug(slug),
      resolveSeasonTags(seasons),
    ])

    const nonSeasonTags = (current.tags ?? [])
      .filter((tag) => !isSeasonTag(tag))
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      }))

    return mealieApiClient.patch<MealieRecipeOutput>(`/api/recipes/${slug}`, {
      name: current.name,
      tags: [...nonSeasonTags, ...seasonTags],
    })
  }

  async updateCalorieTags(slug: string, calories: number): Promise<MealieRecipeOutput> {
    const current = await this.getBySlug(slug)

    const calorieName = buildCalorieTag(calories)

    // 🔍 Cherche si le tag existe déjà
    const existingTags = await tagRepository.getPage(1, 50, calorieName)

    const existingTag = existingTags.items.find((tag) => equalsNormalizedText(tag.name, calorieName))

    const calorieTag = existingTag
      ? {
        id: existingTag.id,
        name: existingTag.name,
        slug: existingTag.slug,
      }
      : {
        name: calorieName,
        slug: calorieName,
      }

    // 🧹 Supprime anciens tags calorie
    const nonCalorieTags = (current.tags ?? [])
      .filter((tag) => !isCalorieTag(tag))
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      }))

    return mealieApiClient.patch<MealieRecipeOutput>(`/api/recipes/${slug}`, {
      name: current.name,
      tags: [...nonCalorieTags, calorieTag],
    })
  }

  async uploadImage(slug: string, file: File): Promise<void> {
    return mealieApiClient.uploadImage(slug, file)
  }
}
