use rand::{seq::SliceRandom, thread_rng};

const INGREDIENTS: [&str; 35] = [
    "avocado",
    "basil",
    "beans",
    "beets",
    "broccoli",
    "broth",
    "cabbage",
    "carrots",
    "cauliflower",
    "celery",
    "chili",
    "chives",
    "cilantro",
    "corn",
    "cumin",
    "garlic",
    "ginger",
    "kale",
    "leek",
    "lentils",
    "mushrooms",
    "onions",
    "oregano",
    "parsley",
    "pasta",
    "peas",
    "pepper",
    "potatoes",
    "salt",
    "spinach",
    "squash",
    "thyme",
    "tofu",
    "tomatoes",
    "turnips",
];

pub fn id(length: usize, separator: &str) -> String {
    let mut rng = thread_rng();
    (0..length)
        .map(|_| INGREDIENTS.choose(&mut rng).unwrap().to_string())
        .collect::<Vec<String>>()
        .join(separator)
}
